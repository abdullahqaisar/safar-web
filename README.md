# سفر

A user-friendly web application designed to help commuters navigate Islamabad's Metro Bus System efficiently.

## Features

- Find the best route between any two metro stations
- Locate the nearest metro station to your current location or destination
- Calculate total number of stops and estimated distance
- Support for route planning with up to 2 line changes
- Interactive map interface for location selection
- Optimized routes based on minimal transfers and distance
- Newsletter subscription for transit updates

## Usage

1. Grant location access or enter your starting point
2. Select your destination
3. Click "Find Route" to see the optimal path
4. View detailed directions including:
   - Line changes
   - Station sequences
   - Total number of stops
   - Estimated distance

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Resend Email Integration

This application uses Resend for sending emails and managing newsletter subscriptions:

1. Create a [Resend](https://resend.com) account
2. Generate an API key in the Resend dashboard
3. Create an audience for subscribers in Resend
4. Copy `.env.local.example` to `.env.local` and add your API key and audience ID:
   ```
   RESEND_API_KEY=re_xxxxxxxxx
   RESEND_AUDIENCE_ID=aud_xxxxxxxxxxx
   ```

Subscribers will automatically be added to your Resend audience when they sign up through the newsletter form.

### Email Template Details

The application implements two approaches for email templates:

1. **React Email Template**: Uses a React component for structured emails
2. **HTML Fallback**: If the React template fails, falls back to HTML with inline SVG

The email logo is implemented as an inline SVG directly in the email, which prevents issues with external image loading and ensures the logo is always displayed correctly across email clients.

## Technology Stack

- Next.js
- TypeScript
- Tailwind CSS
- Google Maps API
- Resend for email services
