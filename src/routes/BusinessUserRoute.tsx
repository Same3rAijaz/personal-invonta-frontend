import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function BusinessUserRoute() {
  const { user } = useAuth();
  if (user?.role === "SUPER_ADMIN") return <Navigate to="/superadmin/businesses" replace />;
  return <Outlet />;
}
