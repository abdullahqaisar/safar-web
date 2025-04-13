'use client';

import { useState, useCallback, FormEvent, useEffect } from 'react';
import { ContributionFormData, FormState } from '../types';
import { sendContributionEmail } from '../services/emailService';

// Initial form data
const initialFormData: ContributionFormData = {
  name: '',
  email: '',
  contributionType: '',
  routeDetails: '',
  stationDetails: '',
  description: '',
  isAgreedToTerms: false,
};

// Initial form state
const initialFormState: FormState = {
  isSubmitting: false,
  isSuccess: false,
  error: null,
};

export function useContributionForm() {
  // Form data state
  const [formData, setFormData] =
    useState<ContributionFormData>(initialFormData);

  // Form state for UI feedback
  const [formState, setFormState] = useState<FormState>(initialFormState);

  // Track which fields have been touched/visited
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>(
    {}
  );

  // Reset error after a delay when it's displayed
  useEffect(() => {
    if (formState.error) {
      const timer = setTimeout(() => {
        setFormState((prev) => ({ ...prev, error: null }));
      }, 8000); // Clear error after 8 seconds

      return () => clearTimeout(timer);
    }
  }, [formState.error]);

  // Handle input changes
  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const { name, value, type } = e.target;

      // Handle checkbox inputs specially
      if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setFormData((prev) => ({ ...prev, [name]: checked }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }

      // Clear error when user is typing
      if (formState.error) {
        setFormState((prev) => ({ ...prev, error: null }));
      }
    },
    [formState.error]
  );

  // Mark field as visited/touched
  const handleBlur = useCallback((e: React.FocusEvent<HTMLElement>) => {
    const fieldName = (
      e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    ).name;
    setTouchedFields((prev) => ({ ...prev, [fieldName]: true }));
  }, []);

  // Determine if a field should show validation errors
  const shouldShowError = useCallback(
    (fieldName: string) => {
      return touchedFields[fieldName] || formState.isSubmitting;
    },
    [touchedFields, formState.isSubmitting]
  );

  // Validate the form
  const validateForm = useCallback(() => {
    // Required fields validation
    if (!formData.name) {
      return 'Name is required';
    }

    if (!formData.email) {
      return 'Email is required';
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Please enter a valid email address';
    }

    if (!formData.contributionType) {
      return 'Please select a contribution type';
    }

    if (!formData.description) {
      return 'Description is required';
    }

    if (!formData.isAgreedToTerms) {
      return 'You must agree to the terms';
    }

    // Route-specific validations
    if (formData.contributionType === 'route' && !formData.routeDetails) {
      return 'Please provide details about the route';
    }

    // Station-specific validations
    if (formData.contributionType === 'station' && !formData.stationDetails) {
      return 'Please provide details about the station';
    }

    return null;
  }, [formData]);

  // Reset the form
  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setFormState(initialFormState);
    setTouchedFields({});
  }, []);

  // Handle form submission with improved error handling
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      // Set all fields as touched
      const allFieldsTouched: Record<string, boolean> = {};
      Object.keys(formData).forEach((key) => {
        allFieldsTouched[key] = true;
      });
      setTouchedFields(allFieldsTouched);

      // Validate form
      const validationError = validateForm();
      if (validationError) {
        setFormState({
          isSubmitting: false,
          isSuccess: false,
          error: validationError,
        });
        return;
      }

      // Start submission
      setFormState({
        isSubmitting: true,
        isSuccess: false,
        error: null,
      });

      try {
        // Send the contribution data
        const result = await sendContributionEmail(formData);

        if (result.success) {
          // Success! Reset form and show success message
          setFormState({
            isSubmitting: false,
            isSuccess: true,
            error: null,
          });

          // Reset form fields but keep success state
          setFormData(initialFormData);

          // Scroll to top of form for better UX
          window.scrollTo({ top: window.scrollY - 100, behavior: 'smooth' });
        } else {
          // Server returned an error
          setFormState({
            isSubmitting: false,
            isSuccess: false,
            error: result.message,
          });

          // Scroll to error message for visibility
          setTimeout(() => {
            const errorElement = document.querySelector('.animate-fade-in-up');
            if (errorElement) {
              errorElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              });
            }
          }, 100);
        }
      } catch (error) {
        // Unexpected error
        console.error('Error submitting contribution:', error);
        setFormState({
          isSubmitting: false,
          isSuccess: false,
          error: 'An unexpected error occurred. Please try again later.',
        });
      }
    },
    [formData, validateForm]
  );

  return {
    formData,
    formState,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    shouldShowError,
  };
}
