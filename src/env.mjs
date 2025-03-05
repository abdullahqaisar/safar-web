import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().min(1),
  GOOGLE_MAPS_API_KEY: z.string().min(1),
});

export const env = envSchema.parse(process.env);
