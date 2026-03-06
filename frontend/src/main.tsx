import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SaasProvider } from '@saas-ui/react';
import { extendTheme } from '@chakra-ui/react';
import './global.css';
import './i18n';
import App from './app/App.tsx';

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SaasProvider theme={theme}>
      <App />
    </SaasProvider>
  </StrictMode>,
);
