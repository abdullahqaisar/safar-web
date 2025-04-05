'use client';

import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import { Coordinates } from '@/types/station';
import { cn } from '@/lib/utils/formatters';
import usePlacesSearch from '../hooks/usePlacesSearch';
import SearchDropdown from './SearchDropdown';
import { LucideIcon, Loader2, X } from 'lucide-react';
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
  const selectItem = async (description: string) => {
    try {
      setIsSelectingItem(true);
      await handleSelectPlace(description);

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
          selectItem(suggestions[highlightedIndex].description);
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

  return (
    <div className="relative w-full">
      <div
        className={cn(
          'absolute left-4 top-3.5',
          lightMode
            ? 'text-[color:var(--color-accent)]'
            : 'text-[color:var(--color-accent-dark)]'
        )}
      >
        <Icon size={18} />
      </div>

      <input
        ref={inputRef}
        id={id}
        value={inputValue}
        onChange={onInputChange}
        onKeyDown={handleKeyDown}
        disabled={!isReady}
        className={cn(
          'w-full h-12 pl-12 pr-10 rounded-lg border',
          'transition-all duration-200 ease-in-out',
          'focus:ring-2 focus:ring-[color:var(--color-accent)] focus:border-transparent focus:outline-none',
          isFocused
            ? 'border-[color:var(--color-accent)] bg-white shadow-md'
            : hasSelectedLocation
            ? lightMode
              ? 'border-gray-100 bg-white'
              : 'border-green-200 bg-white'
            : lightMode
            ? 'border-gray-100 bg-white'
            : 'border-gray-200 bg-gray-50'
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

      {isLoading && inputValue && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400">
          <Loader2 size={16} className="animate-spin" />
          <span className="sr-only">Loading</span>
        </div>
      )}

      {inputValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded-full hover:bg-gray-100"
          aria-label="Clear input"
        >
          <X size={16} />
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
        onSelectItem={selectItem}
        onHighlightItem={setHighlightedIndex}
        dropdownRef={dropdownRef}
      />
    </div>
  );
}
