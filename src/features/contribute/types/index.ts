export interface ContributionData {
  name: string;
  email: string;
  contributionType: string;
  routeDetails?: string;
  stationDetails?: string;
  description: string;
  isAgreedToTerms: boolean;
}

export type ContributionFormData = {
  name: string;
  email: string;
  contributionType: string;
  routeDetails: string;
  stationDetails: string;
  description: string;
  isAgreedToTerms: boolean;
};

export interface FormState {
  isSubmitting: boolean;
  isSuccess: boolean;
  error: string | null;
}
