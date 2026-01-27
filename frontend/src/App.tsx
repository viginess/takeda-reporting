import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { trpc } from './utils/trpc';
import './App.css';

function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: 'http://localhost:3000',
          // You can pass any HTTP headers you wish here
          // headers() {
          //   return {
          //     authorization: getAuthCookie(),
          //   };
          // },
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <DemoComponent />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

function DemoComponent() {
  const hello = trpc.greeting.useQuery({ name: 'Takeda User' });

  return (
    <div className="app-container">
      <h1>Takeda Reporting</h1>
      <div className="card">
        {hello.isLoading ? (
          <p>Loading...</p>
        ) : (
          <p className="greeting">{hello.data?.text}</p>
        )}
      </div>
    </div>
  );
}

export default App;
