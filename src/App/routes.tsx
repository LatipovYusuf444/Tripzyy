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
import Profile from "@/pages/Profile"
import ProtectedRoute from "@/pages/auth/ProtectedRoute"
import NotFound from "@/pages/NotFound"
import PassengersPage from "@/pages/Passengers"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },

      { path: "about", element: <About /> },
      { path: "services", element: <Services /> },
      { path: "flights", element: <Flights /> },

      // ✅ NEW: Passengers (karzinka)
      { path: "passengers", element: <PassengersPage /> },

      { path: "contact", element: <Contact /> },
      { path: "faq", element: <FAQ /> },

      { path: "register", element: <RegisterPage /> },

      {
        element: <ProtectedRoute />,
        children: [{ path: "profile", element: <Profile /> }],
      },

      { path: "404", element: <NotFound /> },
      { path: "*", element: <Navigate to="/404" replace /> },
    ],
  },
])
