import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/Page/Layout";
import Home from "./Page/Home";
import About from "./Page/About";
import RegisterPage from "./components/RegisterPage"; // ✅ sizda qayerda tursa o‘sha path

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "about", element: <About /> },

      // ✅ REGISTER ROUTE
      { path: "register", element: <RegisterPage /> }, // => /register
    ],
  },
]);

