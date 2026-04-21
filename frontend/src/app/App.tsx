import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Config & Clients
import { trpc } from '../utils/config/trpc';
import { isRTL } from '../utils/common/languages';
import { queryClient, trpcClient } from '../utils/config/trpcConfig';

// Public Pages
import WelcomePage from '../features/welcome/WelcomePage';
import PrivacyPolicyPage from '../features/legal/PrivacyPolicyPage';
import TermsConditionsPage from '../features/legal/TermsConditionsPage';
import ImprintPage from '../features/legal/ImprintPage';
import ContactPage from '../features/contact/ContactPage';

// Admin Sub-App
import AdminApp from '../admin/app/AdminApp';

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const updateDirection = (lng: string) => {
      document.documentElement.dir = isRTL(lng) ? 'rtl' : 'ltr';
      document.documentElement.lang = lng;
    };

    updateDirection(i18n.language);
    i18n.on('languageChanged', updateDirection);

    return () => {
      i18n.off('languageChanged', updateDirection);
    };
  }, [i18n]);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {/* Public/Reporter Routes */}
            <Route path="/" element={<WelcomePage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms-conditions" element={<TermsConditionsPage />} />
            <Route path="/imprint" element={<ImprintPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Admin Sub-App (Delegated) */}
            <Route path="/admin/*" element={<AdminApp />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
