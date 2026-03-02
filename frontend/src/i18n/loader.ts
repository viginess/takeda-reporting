import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "../utils/trpc";

/**
 * Hook to handle dynamic loading of translations via tRPC.
 */
export const useLanguageLoader = () => {
  const { i18n } = useTranslation();
  const mutation = trpc.translation.getLanguage.useMutation();

  const loadLanguage = useCallback(
    async (languageCode: string) => {
      if (i18n.hasResourceBundle(languageCode, "translation")) {
        await i18n.changeLanguage(languageCode);
        return;
      }

      try {
        const bundle = await mutation.mutateAsync({ languageCode });
        i18n.addResourceBundle(languageCode, "translation", bundle, true, true);
        await i18n.changeLanguage(languageCode);
      } catch (error) {
        console.error("Failed to load translation:", error);
      }
    },
    [i18n, mutation],
  );

  return { loadLanguage, isLoading: mutation.isPending };
};
