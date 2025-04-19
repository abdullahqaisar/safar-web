'use client';

import React from 'react';
import { useContributionForm } from '../hooks/useContributionForm';
import { Loader2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils/formatters';
import { ContributionFormData } from '../types';

const CONTRIBUTION_TYPES = [
  { value: '', label: 'Select contribution type' },
  { value: 'route', label: 'Transit Route Data' },
  { value: 'station', label: 'Station Information' },
  { value: 'service', label: 'Service Schedule' },
  { value: 'feedback', label: 'General Feedback' },
  { value: 'other', label: 'Other' },
];

// Add a function to provide field-specific error messages
const getFieldErrorMessage = (
  fieldName: string,
  formData: ContributionFormData
) => {
  // Add specific validation error messages
  if (
    fieldName === 'email' &&
    formData.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
  ) {
    return 'Please enter a valid email address';
  }

  if (fieldName === 'contributionType' && !formData.contributionType) {
    return 'Please select a contribution type';
  }

  if (
    fieldName === 'routeDetails' &&
    formData.contributionType === 'route' &&
    !formData.routeDetails
  ) {
    return 'Please provide details about the route';
  }

  if (
    fieldName === 'stationDetails' &&
    formData.contributionType === 'station' &&
    !formData.stationDetails
  ) {
    return 'Please provide details about the station';
  }

  // Generic "required" message for empty fields
  return 'This field is required';
};

export default function ContributionForm() {
  const {
    formData,
    formState,
    handleChange,
    handleBlur,
    handleSubmit,
    shouldShowError,
  } = useContributionForm();

  // Improve the helper function for field error classes with error tooltips
  const getInputClasses = (fieldName: string) => {
    const baseClasses =
      'w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[color:var(--color-accent)]/30 focus:border-[color:var(--color-accent)] transition-all';

    if (shouldShowError(fieldName)) {
      // Field is invalid - check if it has value
      const hasValue = Boolean(
        fieldName === 'isAgreedToTerms'
          ? formData.isAgreedToTerms
          : formData[fieldName as keyof typeof formData]
      );

      if (!hasValue) {
        return `${baseClasses} border-red-300 bg-red-50`;
      }

      // Check for specific validation errors like email format
      if (
        fieldName === 'email' &&
        formData.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
      ) {
        return `${baseClasses} border-red-300 bg-red-50`;
      }
    }

    return baseClasses;
  };

  // Enhance with error messages for each field
  const renderFieldError = (fieldName: string) => {
    if (!shouldShowError(fieldName)) return null;

    // Get field value - with proper type handling
    let value: string | boolean = '';

    if (fieldName === 'isAgreedToTerms') {
      value = formData.isAgreedToTerms;
    } else {
      value = formData[fieldName as keyof typeof formData] as string;
    }

    // Show error if field is empty or has validation issues
    const shouldShow =
      (typeof value === 'string' && !value) ||
      (typeof value === 'boolean' && !value) ||
      (fieldName === 'email' &&
        typeof value === 'string' &&
        value &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) ||
      (fieldName === 'routeDetails' &&
        formData.contributionType === 'route' &&
        !formData.routeDetails) ||
      (fieldName === 'stationDetails' &&
        formData.contributionType === 'station' &&
        !formData.stationDetails);

    if (shouldShow) {
      return (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle size={12} className="mr-1" />
          {getFieldErrorMessage(fieldName, formData)}
        </p>
      );
    }

    return null;
  };

  // Show the specific field based on contribution type
  const showRouteField = formData.contributionType === 'route';
  const showStationField = formData.contributionType === 'station';

  // Success state rendering
  if (formState.isSuccess) {
    return (
      <div className="bg-[color:var(--color-accent)]/5 border border-[color:var(--color-accent)]/20 rounded-lg p-8 text-center transform transition-all">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-[color:var(--color-accent)]/10 rounded-full flex items-center justify-center mb-2">
            <CheckCircle size={36} className="text-[color:var(--color-accent)]" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Thank You for Your Contribution!
        </h3>
        <p className="text-gray-600 mb-6">
          We greatly appreciate your input. Our team will review your
          contribution and incorporate it into our transit data system.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-dark)] text-white font-medium rounded-lg transition-all flex items-center mx-auto gap-2 hover:gap-3"
        >
          <span>Submit Another Contribution</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Error message display */}
      {formState.error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg p-4 animate-in fade-in-50 duration-300">
          <AlertCircle size={18} />
          <span>{formState.error}</span>
        </div>
      )}

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Your name"
            className={getInputClasses('name')}
            required
          />
          {renderFieldError('name')}
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Your email address"
            className={getInputClasses('email')}
            required
          />
          {renderFieldError('email')}
        </div>
      </div>

      {/* Contribution Type */}
      <div>
        <label
          htmlFor="contributionType"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Contribution Type <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            id="contributionType"
            name="contributionType"
            value={formData.contributionType}
            onChange={handleChange}
            onBlur={handleBlur}
            className={cn(
              getInputClasses('contributionType'),
              'cursor-pointer appearance-none pr-10'
            )}
            required
          >
            {CONTRIBUTION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </div>
        </div>
        {renderFieldError('contributionType')}
      </div>

      {/* Conditional Fields */}
      {showRouteField && (
        <div className="animate-in fade-in-50 duration-300">
          <label
            htmlFor="routeDetails"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Route Details <span className="text-red-500">*</span>
          </label>
          <textarea
            id="routeDetails"
            name="routeDetails"
            rows={3}
            value={formData.routeDetails}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Please provide details about the route (e.g., starting point, end point, major stops)"
            className={getInputClasses('routeDetails')}
            required={showRouteField}
          ></textarea>
          <p className="text-xs text-gray-500 mt-1">
            Include information about route number, color code, and any other
            relevant details.
          </p>
          {renderFieldError('routeDetails')}
        </div>
      )}

      {showStationField && (
        <div className="animate-in fade-in-50 duration-300">
          <label
            htmlFor="stationDetails"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Station Details <span className="text-red-500">*</span>
          </label>
          <textarea
            id="stationDetails"
            name="stationDetails"
            rows={3}
            value={formData.stationDetails}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Please provide details about the station (e.g., name, location, services available)"
            className={getInputClasses('stationDetails')}
            required={showStationField}
          ></textarea>
          <p className="text-xs text-gray-500 mt-1">
            Include information about accessibility features, nearby landmarks,
            and geographic coordinates if available.
          </p>
          {renderFieldError('stationDetails')}
        </div>
      )}

      {/* Description - always visible */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          value={formData.description}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Please provide a detailed description of your contribution"
          className={getInputClasses('description')}
          required
        ></textarea>
        {renderFieldError('description')}
      </div>

      {/* Terms Agreement */}
      <div className="flex items-start p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
        <div className="flex items-center h-5">
          <input
            id="isAgreedToTerms"
            name="isAgreedToTerms"
            type="checkbox"
            checked={formData.isAgreedToTerms}
            onChange={handleChange}
            onBlur={handleBlur}
            className="h-4 w-4 text-[color:var(--color-accent)] focus:ring-[color:var(--color-accent)]/30 border-gray-300 rounded"
          />
        </div>
        <div className="ml-3 text-sm">
          <label
            htmlFor="isAgreedToTerms"
            className="font-medium text-gray-700"
          >
            I agree to the terms and conditions{' '}
            <span className="text-red-500">*</span>
          </label>
          <p className="text-gray-500 text-xs mt-1">
            By submitting this form, you agree that your contribution may be
            used to improve the Safar transit application and shared with
            relevant transit authorities.
          </p>
          {renderFieldError('isAgreedToTerms')}
        </div>
      </div>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={formState.isSubmitting}
          className="w-full px-6 py-3 bg-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-dark)] text-white font-medium rounded-lg shadow-sm hover:shadow transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] group"
        >
          {formState.isSubmitting ? (
            <span className="flex items-center justify-center">
              <Loader2 className="animate-spin mr-2" size={18} />
              Submitting...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1 group-hover:gap-2 transition-all">
              <span>Submit Contribution</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          )}
        </button>
      </div>

      {/* Privacy Note */}
      <div className="text-xs text-center text-gray-500 mt-4">
        Your personal information will be handled in accordance with our Privacy
        Policy. We will not share your contact details with third parties
        without your consent.
      </div>
    </form>
  );
}
