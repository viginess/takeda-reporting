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

// Simple helper to get or create a persistent guest ID
const getGuestId = () => {
  let id = localStorage.getItem('reporting_guest_id');
  if (!id) {
    id = `guest_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem('reporting_guest_id', id);
  }
  return id;
};

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}`
        : 'http://localhost:3000',
      headers: () => ({
        'x-client-id': getGuestId(),
      }),
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
