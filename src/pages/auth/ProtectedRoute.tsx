import { Navigate, Outlet, useLocation } from "react-router-dom"

export default function ProtectedRoute() {
  const location = useLocation()
  const token = localStorage.getItem("access_token")

  if (!token) {
    return <Navigate to="/register" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
