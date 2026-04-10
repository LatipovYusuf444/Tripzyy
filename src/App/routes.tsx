import { createBrowserRouter, Navigate } from "react-router-dom";
import Layout from "@/pages/Layout";
// Pages
import Home from "@/pages/Home";
import About from "@/pages/About";
import Flights from "@/pages/Flights";
import FlightCatalog from "@/pages/FlightCatalog";
import Services from "@/pages/Services";
import Contact from "@/pages/Contact";
import FAQ from "@/pages/FAQ";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import Profile from "@/pages/Profile";
import ProtectedRoute from "@/pages/auth/ProtectedRoute";
import NotFound from "@/pages/NotFound";
import PassengersPage from "@/pages/Passengers";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },

      { path: "register", element: <RegisterPage initialMode="register" /> },
      { path: "login", element: <LoginPage /> },

      {
        element: <ProtectedRoute />,
        children: [
          { path: "about", element: <About /> },
          { path: "services", element: <Services /> },
          { path: "flights", element: <Flights /> },
          { path: "flight-catalog", element: <FlightCatalog /> },
          { path: "passengers", element: <PassengersPage /> },
          { path: "checkout", element: <PassengersPage /> },
          { path: "contact", element: <Contact /> },
          { path: "faq", element: <FAQ /> },
          { path: "profile", element: <Profile /> },
        ],
      },

      { path: "404", element: <NotFound /> },
      { path: "*", element: <Navigate to="/404" replace /> },
    ],
  },
]);
