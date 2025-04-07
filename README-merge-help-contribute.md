# Merging Help and Contribute Pages

This document outlines the changes made to merge the Help and Contribute pages into a single unified section of the application.

## Overview

The Help and Contribute pages have been merged into a single "Contribute & Support" page with tabbed interface to provide users with a cohesive experience for both contributing data and getting help.

## Key Changes

1. **New Components Created:**

   - `src/features/contribute/components/ContactForm.tsx`: Moved from Help page's ContactSection
   - `src/features/contribute/components/FAQSection.tsx`: Moved from Help page
   - `src/features/contribute/components/TroubleshootingSection.tsx`: Enhanced version with support for condensed display
   - `src/features/contribute/services/contactEmailService.ts`: Email service for contact form

2. **Updated Components:**

   - `src/features/contribute/components/ContributePage.tsx`: Now includes tabs for Contribute, FAQs, and Support
   - `src/components/layouts/Navbar.tsx`: Removed Help link and updated Contribute to "Contribute & Support"

3. **Redirects:**
   - Added redirects in `next.config.js` to send all /help routes to /contribute?tab=support
   - Updated `src/app/help/page.tsx` to programmatically redirect to /contribute?tab=support

## Implementation Details

### Tabbed Interface

The ContributePage now features a tabbed interface with three tabs:

- **Contribute**: The original contribution form for submitting transit data
- **FAQs**: Frequently asked questions about the app (from Help page)
- **Support**: Contact form and troubleshooting tips (from Help page)

### URL Query Parameters

The page responds to query parameters to allow deep linking to specific tabs:

- `/contribute` or `/contribute?tab=contribute`: Shows the contribute form
- `/contribute?tab=faq`: Shows the FAQs
- `/contribute?tab=support`: Shows the contact form and troubleshooting tips

### Support Cards

Support information cards (email, community links, collaborators) are visible across all tabs for easy access.

## Removed Files

The following files from the Help feature are no longer needed:

- `src/features/help/components/HelpPageContent.tsx`
- `src/features/help/components/sections/ContactSection.tsx`
- `src/features/help/components/sections/FAQSection.tsx`
- `src/features/help/components/sections/TroubleshootingSection.tsx`
- `src/features/help/services/emailService.ts`

## Testing

The implementation has been tested for:

- Proper redirection from /help to /contribute
- Tab navigation and persistence when using URL parameters
- Responsive layout on both mobile and desktop devices
- Functionality of the contribution and contact forms
