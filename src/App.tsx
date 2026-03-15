import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "@/App/routes";
import { applyTheme, getStoredTheme } from "@/shared/theme/theme";

export default function App() {
  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  return <RouterProvider router={router} />;
}
