# Contribute Feature

This feature allows users to submit contributions to the Safar transit data system. The implementation uses React for the front-end form and Resend for email delivery.

## Setup

### Prerequisites

- [Resend](https://resend.com) account and API key

### Configuration

1. Create a Resend account at [resend.com](https://resend.com)
2. Generate an API key from the Resend dashboard
3. Add the API key to your environment variables:

```bash
# .env.local
RESEND_API_KEY=re_123456789
```

## Implementation Details

The Contribute feature consists of:

- **Form Component**: A user-friendly form for submitting various types of contributions
- **Email Service**: A server action that sends the form data to the configured email address
- **Email Template**: A React component that formats the email for better readability

## Components

### `ContributePage`

The main page component that renders the contribution form and informational sidebar.

### `ContributionForm`

The form component with input validation and conditional fields based on the selected contribution type.

### `ContributionEmailTemplate`

A React email template designed for Resend, which formats the contribution data into a well-structured email.

## Services

### `emailService.ts`

A server action that handles form validation and email sending using Resend.

## Customization

### Email Recipients

To change the recipient email address, modify the `to` field in `emailService.ts`:

```typescript
// src/features/contribute/services/emailService.ts
await resend.emails.send({
  from: 'Safar Contributions <contributions@resend.dev>',
  to: 'your-email@example.com', // Change this
  subject: `New Contribution: ${data.contributionType}`,
  react: ContributionEmailTemplate({ data }) as React.ReactElement,
});
```

### Form Fields

To modify the available contribution types, edit the `CONTRIBUTION_TYPES` array in `ContributionForm.tsx`.
