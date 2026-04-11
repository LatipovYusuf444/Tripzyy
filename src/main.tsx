import React from "react"
import ReactDOM from "react-dom/client"
import "./App.css"
import "./index.css"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "sonner"
import App from "./App"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
    },
    mutations: {
      retry: 0,
    },
  },
})

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        richColors
        closeButton
        expand
        toastOptions={{
          className:
            "!border !border-[#dbe3ef] !bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,249,255,0.96)_100%)] !text-[#1d2430] !shadow-[0_20px_60px_rgba(17,24,39,0.14)]",
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
)
