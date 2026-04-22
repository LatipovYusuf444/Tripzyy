import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "@/App/routes";
import { applyTheme, getStoredTheme } from "@/shared/theme/theme";
import { LanguageProvider } from "@/shared/i18n/i18n";
import { ensureDefaultAuthSession } from "@/shared/auth/token";

export default function App() {
  useEffect(() => {
    applyTheme(getStoredTheme());
    ensureDefaultAuthSession();
  }, []);

  return (
    <LanguageProvider>
      <RouterProvider router={router} />
    </LanguageProvider>
  );
}
