import React from 'react';

interface SubscriptionConfirmationProps {
  email: string;
}

export const SubscriptionConfirmation: React.FC<
  SubscriptionConfirmationProps
> = ({ email }) => {
  const currentYear = new Date().getFullYear();

  return (
    <div
      style={{
        fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
        color: '#4b5563',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          marginBottom: '24px',
          paddingTop: '12px',
        }}
      >
        <svg
          width="80"
          height="80"
          viewBox="0 0 270 270"
          style={{ width: '80px', height: '80px' }}
        >
          <rect width="270" height="270" rx="36" fill="#004036" />
          <circle cx="73.5" cy="112" r="42" fill="#F2FBF9" />
          <circle cx="73" cy="111.5" r="22" fill="#004036" />
          <path
            d="M206.988 123C207.634 160.372 182.137 200 135.017 200C98.4381 200 77.9453 170.069 71.651 153.773L69.5 147.163H90.4782C97.9658 171.649 123.29 179.273 135.017 180.025C177.877 178.736 187.731 141.471 187.301 123H206.988Z"
            fill="#F2FBF9"
          />
          <path
            d="M156.5 97.1171V122L197.589 91.6939L239 122V97.1171L201.763 70.3201C198.253 69.8768 196.284 69.9101 192.774 70.3201L156.5 97.1171Z"
            fill="#F2FBF9"
          />
        </svg>
      </div>

      <h2
        style={{
          color: '#004036',
          marginBottom: '16px',
          fontSize: '24px',
          textAlign: 'center',
          fontWeight: 'bold',
        }}
      >
        Thanks for subscribing!
      </h2>

      <p style={{ lineHeight: '1.6', fontSize: '16px', marginBottom: '24px' }}>
        You&apos;re now subscribed to transit updates from Safar. We&apos;ll
        keep you informed about new routes, schedule changes, and app features
        as they become available.
      </p>

      <div
        style={{
          backgroundColor: '#f2fbf9',
          padding: '20px',
          borderRadius: '8px',
          margin: '24px 0',
          borderLeft: '4px solid #004036',
        }}
      >
        <p style={{ margin: '0', lineHeight: '1.6' }}>
          <strong>What to expect:</strong>
          <br />
          • Transit network updates
          <br />
          • New app features
          <br />• Service changes and announcements
        </p>
      </div>

      <p style={{ fontSize: '14px', marginTop: '32px', color: '#6b7280' }}>
        If you didn&apos;t sign up for this newsletter (email: {email}), you can
        safely ignore this email.
      </p>

      <div
        style={{
          borderTop: '1px solid #e5e7eb',
          marginTop: '32px',
          paddingTop: '16px',
          textAlign: 'center',
        }}
      >
        <p style={{ color: '#6b7280', fontSize: '12px' }}>
          © {currentYear} Safar. All rights reserved.
        </p>
      </div>
    </div>
  );
};
