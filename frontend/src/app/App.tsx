import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { trpc } from '../utils/trpc';
import WelcomePage from '../WelcomePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1 },
    mutations: { retry: 0 },
  },
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}`
        : 'http://localhost:3000',
    }),
  ],
});

function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <WelcomePage />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
