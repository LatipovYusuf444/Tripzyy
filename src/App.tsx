import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "@/App/routes";
import { applyTheme, getStoredTheme } from "@/shared/theme/theme";
import { LanguageProvider } from "@/shared/i18n/i18n";

export default function App() {
  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  return (
    <LanguageProvider>
      <RouterProvider router={router} />
    </LanguageProvider>
  );
}
