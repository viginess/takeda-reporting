import axios from 'axios';
import { TRPCError } from '@trpc/server';

interface RecaptchaResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

/**
 * Verifies a reCAPTCHA token with Google's API.
 * @param token The token received from the frontend.
 * @returns Promise that resolves if verification is successful, or throws a TRPCError.
 */
export async function verifyRecaptcha(token: string) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  // If no secret is configured, skip verification (useful for local development)
  if (!secret || secret === 'paste_your_secret_key_here') {
    console.warn('RECAPTCHA_SECRET_KEY is not configured. Skipping verification.');
    return true;
  }

  // Handle bypass token for environments without site key
  if (token === 'bypass') {
    return true;
  }

  try {
    const response = await axios.post<RecaptchaResponse>(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret,
          response: token,
        },
      }
    );

    if (!response.data.success) {
      console.error('reCAPTCHA verification failed:', response.data['error-codes']);
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'reCAPTCHA verification failed. Please try again.',
      });
    }

    return true;
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    
    console.error('Error during reCAPTCHA verification:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to verify reCAPTCHA. Please try again later.',
    });
  }
}
