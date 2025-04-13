'use client';

import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import { Coordinates } from '@/types/station';
import { cn } from '@/lib/utils/formatters';
import usePlacesSearch from '../hooks/usePlacesSearch';
import SearchDropdown from './SearchDropdown';
import { LucideIcon, Loader2, X, Search } from 'lucide-react';
import React from 'react';

interface SearchInputProps {
  id: string;
  onSelectPlace: (location: Coordinates | null) => void;
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  icon: LucideIcon;
  lightMode?: boolean;
}

export default function SearchInput({
  id,
  onSelectPlace,
  placeholder,
  value,
  onValueChange,
  icon: Icon,
  lightMode = false,
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isSelectingItem, setIsSelectingItem] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [hasSuggestions, setHasSuggestions] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement | null>;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const focusTimeRef = useRef<number>(0);

  const {
    value: inputValue,
    isLoading,
    isReady,
    suggestions,
    status,
    handleInputChange,
    handleClear,
    handleSelectPlace,
    hasSelectedLocation,
  } = usePlacesSearch({
    initialValue: value,
    onLocationSelect: onSelectPlace,
    onValueChange,
  });

  // Update hasSuggestions state when suggestions change
  useEffect(() => {
    setHasSuggestions(suggestions.length > 0);
  }, [suggestions]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    const shouldShowDropdown =
      isFocused &&
      isReady &&
      inputValue.length > 0 &&
      (status === 'OK' || hasInteracted);

    setShowDropdown(shouldShowDropdown);

    if (!isFocused && !isSelectingItem) {
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        setShowDropdown(false);
      }, 200);
    }
  }, [isFocused, isReady, status, inputValue, hasInteracted, isSelectingItem]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        inputRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setIsSelectingItem(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Input change handler
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasInteracted(true);
    handleInputChange(e.target.value);
    setHighlightedIndex(-1);
  };

  // Select an item from dropdown
  const selectItem = async (description: string, index: number) => {
    try {
      setIsSelectingItem(true);
      const suggestion = suggestions[index];

      // Check if this is a station selection
      if (suggestion?.isStation && suggestion?.station) {
        await handleSelectPlace(description, suggestion.station);
      } else {
        await handleSelectPlace(description);
      }

      if (inputRef.current) {
        if (id === 'from-location') {
          setTimeout(() => {
            const toField = document.getElementById(
              'to-location'
            ) as HTMLInputElement;
            if (toField) toField.focus();
          }, 10);
        } else {
          inputRef.current.blur();
          setShowDropdown(false);
        }
      }
    } finally {
      setTimeout(() => {
        setIsSelectingItem(false);
        setShowDropdown(false);
      }, 300);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (status === 'OK' && suggestions.length > 0) {
          setHighlightedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (status === 'OK' && suggestions.length > 0) {
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (
          status === 'OK' &&
          highlightedIndex >= 0 &&
          suggestions[highlightedIndex]
        ) {
          selectItem(
            suggestions[highlightedIndex].description,
            highlightedIndex
          );
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  };

  // Focus management
  const handleFocus = () => {
    const focusTime = Date.now();
    focusTimeRef.current = focusTime;
    setIsFocused(true);

    if (inputValue.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleBlur = () => {
    if (!isSelectingItem) {
      setTimeout(() => {
        if (focusTimeRef.current <= Date.now() - 200) {
          setIsFocused(false);
        }
      }, 200);
    }
  };

  // Handle search dropdown item selection
  const handleSelectDropdownItem = (description: string, index?: number) => {
    if (typeof index === 'number') {
      void selectItem(description, index);
    } else if (highlightedIndex >= 0) {
      void selectItem(description, highlightedIndex);
    }
  };

  return (
    <div className="relative w-full">
      <div
        className={cn(
          'absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 transition-all duration-200 z-10',
          isFocused
            ? lightMode
              ? 'text-[color:var(--color-accent)]'
              : 'text-[color:var(--color-accent-dark)]'
            : hasSelectedLocation
              ? lightMode
                ? 'text-[color:var(--color-accent)]'
                : 'text-emerald-600'
              : lightMode
                ? 'text-gray-400'
                : 'text-gray-500'
        )}
      >
        {isLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : hasSelectedLocation ? (
          <Icon size={16} />
        ) : (
          <Search size={16} />
        )}
      </div>

      <input
        ref={inputRef}
        id={id}
        value={inputValue}
        onChange={onInputChange}
        onKeyDown={handleKeyDown}
        disabled={!isReady}
        className={cn(
          'w-full h-10 sm:h-11 pl-9 sm:pl-10 pr-8 sm:pr-10 rounded-lg border text-base',
          'transition-all duration-200 ease-in-out',
          'focus:ring-2 focus:border-transparent focus:outline-none',
          isFocused
            ? 'border-transparent ring-2 ring-[color:var(--color-accent)] bg-white shadow-md'
            : hasSelectedLocation
              ? lightMode
                ? 'border-gray-100 bg-white'
                : 'border-emerald-200 bg-white shadow-sm'
              : lightMode
                ? 'border-gray-100 bg-white'
                : 'border-gray-200 bg-gray-50',
          'text-sm sm:text-base'
        )}
        placeholder={placeholder}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoComplete="off"
        role="combobox"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
        aria-controls={`${id}-dropdown-list`}
        aria-activedescendant={
          highlightedIndex >= 0 ? `${id}-item-${highlightedIndex}` : undefined
        }
      />

      {inputValue && (
        <button
          type="button"
          onClick={handleClear}
          className={cn(
            'absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-all',
            'hover:text-gray-600 p-1 sm:p-1.5 rounded-full hover:bg-gray-100',
            isFocused ? 'opacity-100 visible' : 'opacity-70'
          )}
          aria-label="Clear input"
        >
          <X size={14} className="sm:w-4 sm:h-4" />
        </button>
      )}

      <SearchDropdown
        id={id}
        show={showDropdown && inputValue.length > 0}
        isReady={isReady}
        isLoading={isLoading}
        status={status}
        suggestions={suggestions}
        highlightedIndex={highlightedIndex}
        onSelectItem={handleSelectDropdownItem}
        onHighlightItem={setHighlightedIndex}
        dropdownRef={dropdownRef}
      />

      {/* Accessible status indicator for screen readers */}
      <div className="sr-only" aria-live="polite">
        {isLoading
          ? 'Searching...'
          : hasSuggestions
            ? `${suggestions.length} suggestions found`
            : ''}
      </div>
    </div>
  );
}
