import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SaasProvider } from '@saas-ui/react';
import { extendTheme } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import './index.css';
import App from './app/App.tsx';
import { trpc } from './utils/trpc';

const theme = extendTheme({
  colors: {
    primary: {
      50: '#ffe3e9',
      100: '#ffb5c1',
      200: '#ff8598',
      300: '#ff5470',
      400: '#ff2649',
      500: '#CE0037',
      600: '#a1002b',
      700: '#73001e',
      800: '#460012',
      900: '#1d0004',
    },
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
    }),
  ],
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <SaasProvider theme={theme}>
          <App />
        </SaasProvider>
      </QueryClientProvider>
    </trpc.Provider>
  </StrictMode>,
);
