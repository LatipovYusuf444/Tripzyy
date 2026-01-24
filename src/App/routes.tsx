// src/App/routes.tsx
import { createBrowserRouter, Navigate } from "react-router-dom"
import Layout from "@/pages/Layout"

// Pages
import Home from "@/pages/Home"
import About from "@/pages/About"
import Flights from "@/pages/Flights"
import Services from "@/pages/Services"
import Contact from "@/pages/Contact"
import FAQ from "@/pages/FAQ"
import RegisterPage from "@/pages/auth/RegisterPage"
import NotFound from "@/pages/NotFound"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "about", element: <About /> },
      { path: "services", element: <Services /> },
      { path: "flights", element: <Flights /> },
      { path: "contact", element: <Contact /> },
      { path: "faq", element: <FAQ /> },

      // ixtiyoriy auth
      { path: "register", element: <RegisterPage /> },

      { path: "404", element: <NotFound /> },
      { path: "*", element: <Navigate to="/404" replace /> },
    ],
  },
])
