'use server';

import { Resend } from 'resend';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function sendContactEmail(data: ContactFormData) {
  try {
    // Validate the required fields
    if (!data.name || !data.email || !data.message) {
      throw new Error('Please fill out all required fields');
    }

    // Initialize Resend client
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      throw new Error('Resend API key is not configured');
    }

    const resend = new Resend(resendApiKey);

    // Format the subject
    const subjectText = data.subject
      ? `Contact Form: ${data.subject}`
      : 'Contact Form Submission';

    // Send email with Resend
    const { data: emailData, error } = await resend.emails.send({
      from: 'Safar Contact <contact@resend.dev>',
      to: 'info@safar.fyi',
      subject: subjectText,
      replyTo: data.email,
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
          <h2 style="color: #004036; margin-bottom: 16px; font-size: 24px; text-align: center; font-weight: bold;">New Contact Message</h2>
          
          <div style="background-color: #f2fbf9; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #004036;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 120px;">Name:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${data.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Email:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${data.email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Subject:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${data.subject || 'Not specified'}</td>
              </tr>
            </table>
          </div>
          
          <div style="margin-top: 24px;">
            <h3 style="color: #004036; font-size: 18px; margin-bottom: 12px;">Message:</h3>
            <p style="color: #4b5563; line-height: 1.6; white-space: pre-wrap; background-color: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
              ${data.message.replace(/\n/g, '<br>')}
            </p>
          </div>
          
          <div style="margin-top: 32px; font-size: 14px; color: #6b7280; text-align: center;">
            This message was sent from the contact form on safar.fyi
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(error.message || 'Failed to send contact email');
    }

    console.log('Contact form data received:', data);
    console.log('Email sent with ID:', emailData?.id);

    return { success: true, message: 'Thank you for your message!' };
  } catch (error) {
    console.error('Failed to send contact email:', error);

    if (error instanceof Error) {
      return { success: false, message: error.message };
    }

    return {
      success: false,
      message: 'Failed to send your message. Please try again later.',
    };
  }
}
