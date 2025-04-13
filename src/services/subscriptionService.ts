'use server';

import { Resend } from 'resend';
import React from 'react';
import { SubscriptionConfirmation } from '@/components/emails/SubscriptionConfirmation';

interface SubscriptionData {
  email: string;
}

export async function subscribeToNewsletter(data: SubscriptionData) {
  try {
    // Validate email
    if (!data.email) {
      throw new Error('Email is required');
    }

    // Validate email format with regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error('Please enter a valid email address');
    }

    // Initialize Resend client
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      throw new Error('Resend API key is not configured');
    }

    const resend = new Resend(resendApiKey);

    // Add subscriber to Resend audience
    try {
      const audienceId = process.env.RESEND_AUDIENCE_ID || 'default';

      await resend.contacts.create({
        email: data.email,
        audienceId: audienceId,
        firstName: '', // Optional: These could be added if collected in the form
        lastName: '',
        unsubscribed: false,
      });

      console.log(`Added ${data.email} to Resend audience ${audienceId}`);
    } catch (audienceError) {
      console.error('Error adding to Resend audience:', audienceError);
      // Continue even if audience addition fails, to still send confirmation email
    }

    // If using React component fails, fall back to HTML
    try {
      // Send confirmation email to the subscriber using React template
      const { data: emailData, error } = await resend.emails.send({
        from: 'Safar Updates <hello@safar.fyi>',
        to: data.email,
        subject: 'Welcome to Safar Updates',
        react: React.createElement(SubscriptionConfirmation, {
          email: data.email,
        }),
      });

      if (error) {
        console.error('Resend API error:', error);
        throw new Error(error.message || 'Failed to send confirmation email');
      }

      console.log('New subscriber:', data.email);
      console.log('Confirmation email sent with ID:', emailData?.id);
    } catch (emailError) {
      console.error(
        'Failed to send React email, falling back to HTML:',
        emailError
      );

      // Fallback to HTML email
      const { data: emailData, error } = await resend.emails.send({
        from: 'Safar Updates <hello@safar.fyi>',
        to: data.email,
        subject: 'Welcome to Safar Updates',
        html: `
          <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 24px; padding-top: 12px;">
              <svg width="80" height="80" viewBox="0 0 270 270" style="width: 80px; height: 80px;">
                <rect width="270" height="270" rx="36" fill="#004036"/>
                <circle cx="73.5" cy="112" r="42" fill="#F2FBF9"/>
                <circle cx="73" cy="111.5" r="22" fill="#004036"/>
                <path d="M206.988 123C207.634 160.372 182.137 200 135.017 200C98.4381 200 77.9453 170.069 71.651 153.773L69.5 147.163H90.4782C97.9658 171.649 123.29 179.273 135.017 180.025C177.877 178.736 187.731 141.471 187.301 123H206.988Z" fill="#F2FBF9"/>
                <path d="M156.5 97.1171V122L197.589 91.6939L239 122V97.1171L201.763 70.3201C198.253 69.8768 196.284 69.9101 192.774 70.3201L156.5 97.1171Z" fill="#F2FBF9"/>
              </svg>
            </div>
            <h2 style="color: #004036; margin-bottom: 16px; font-size: 24px; text-align: center; font-weight: bold;">Thanks for subscribing!</h2>
            <p style="color: #4b5563; line-height: 1.6; font-size: 16px; margin-bottom: 24px;">
              You're now subscribed to transit updates from Safar. We'll keep you informed 
              about new routes, schedule changes, and app features as they become available.
            </p>
            <div style="background-color: #f2fbf9; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #004036;">
              <p style="color: #4b5563; margin: 0; line-height: 1.6;">
                <strong>What to expect:</strong><br>
                • Transit network updates<br>
                • New app features<br>
                • Service changes and announcements
              </p>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
              If you didn't sign up for this newsletter (email: ${data.email}), you can safely ignore this email.
            </p>
            <div style="border-top: 1px solid #e5e7eb; margin-top: 32px; padding-top: 16px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px;">
                © ${new Date().getFullYear()} Safar. All rights reserved.
              </p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error('Resend HTML fallback error:', error);
        throw new Error(error.message || 'Failed to send confirmation email');
      }

      console.log('New subscriber (HTML fallback):', data.email);
      console.log('Confirmation email sent with ID:', emailData?.id);
    }

    return { success: true, message: 'Successfully subscribed to updates!' };
  } catch (error) {
    console.error('Failed to subscribe:', error);

    if (error instanceof Error) {
      return { success: false, message: error.message };
    }

    return {
      success: false,
      message: 'Failed to subscribe. Please try again later.',
    };
  }
}
