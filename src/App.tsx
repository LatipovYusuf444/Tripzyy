import { RouterProvider } from "react-router-dom";
import { router } from "@/App/routes";

export default function App() {
  return <RouterProvider router={router} />;
}
