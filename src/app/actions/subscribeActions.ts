'use server';

import { z } from 'zod';
import { subscribeToNewsletter } from '@/services/subscriptionService';

const subscribeSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export async function subscribe(formData: FormData) {
  const email = formData.get('email') as string;

  // Validate the email
  const result = subscribeSchema.safeParse({ email });

  if (!result.success) {
    return {
      success: false,
      message:
        result.error.errors[0]?.message || 'Please enter a valid email address',
    };
  }

  // Pass to subscription service
  return await subscribeToNewsletter({ email });
}
