'use server';

import { ContributionData } from '../types';
import { Resend } from 'resend';
import React from 'react';
import { ContributionEmailTemplate } from '../components/ContributionEmailTemplate';

export async function sendContributionEmail(data: ContributionData) {
  try {
    // Validate the required fields
    if (
      !data.name ||
      !data.email ||
      !data.contributionType ||
      !data.description
    ) {
      throw new Error('Missing required fields');
    }

    // Check if agreed to terms
    if (!data.isAgreedToTerms) {
      throw new Error('You must agree to the terms');
    }

    // Initialize Resend client
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      throw new Error('Resend API key is not configured');
    }

    const resend = new Resend(resendApiKey);

    // Send email with Resend
    const { data: emailData, error } = await resend.emails.send({
      from: 'Safar Contributions <info@safar.fyi>',
      to: 'info@safar.fyi',
      subject: `New Contribution: ${data.contributionType}`,
      react: ContributionEmailTemplate({ data }) as React.ReactElement,
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(error.message || 'Failed to send email');
    }

    console.log('Contribution data received:', data);
    console.log('Email sent with ID:', emailData?.id);

    return { success: true, message: 'Thank you for your contribution!' };
  } catch (error) {
    console.error('Failed to send contribution email:', error);

    if (error instanceof Error) {
      return { success: false, message: error.message };
    }

    return {
      success: false,
      message: 'Failed to send your contribution. Please try again later.',
    };
  }
}
