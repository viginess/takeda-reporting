import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SaasProvider } from '@saas-ui/react';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SaasProvider>
      <App />
    </SaasProvider>
  </StrictMode>,
);
