import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { TRPCClientError } from '@trpc/client';
import { httpBatchLink } from '@trpc/client';
import { trpc } from './trpc';
import { supabase } from './supabaseClient';

/**
 * Returns a persistent guest ID from localStorage or creates a new one.
 * Used for tracking anonymous reporting sessions.
 */
export const getGuestId = () => {
  let id = localStorage.getItem('reporting_guest_id');
  if (!id) {
    id = `guest_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem('reporting_guest_id', id);
  }
  return id;
};

/**
 * Resolves the TRPC API URL from environment variables.
 */
export const getTrpcUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return 'http://localhost:3000/trpc';
  return envUrl.endsWith('/trpc') ? envUrl : `${envUrl.replace(/\/$/, '')}/trpc`;
};

/**
 * Configure the React Query client with custom error handling.
 * Automatically signs out if the backend returns an UNAUTHORIZED status.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1 },
    mutations: { retry: 0 },
  },
  queryCache: new QueryCache({
    onError: async (err: any) => {
      if (err instanceof TRPCClientError && err.data?.code === 'UNAUTHORIZED') {
        console.warn('Backend session expired. Signing out...');
        await supabase.auth.signOut();
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: async (err: any) => {
      if (err instanceof TRPCClientError && err.data?.code === 'UNAUTHORIZED') {
        console.warn('Backend session expired during mutation. Signing out...');
        await supabase.auth.signOut();
      }
    },
  }),
});

/**
 * Configure the TRPC client with batching and dynamic headers.
 * Injects the Supabase access token and guest ID into every request.
 */
export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: getTrpcUrl(),
      headers: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return {
          'x-client-id': getGuestId(),
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        };
      },
    }),
  ],
});
