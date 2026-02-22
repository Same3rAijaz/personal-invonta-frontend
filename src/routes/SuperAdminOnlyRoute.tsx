import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function SuperAdminOnlyRoute() {
  const { user } = useAuth();
  if (user?.role !== "SUPER_ADMIN") return <Navigate to="/" replace />;
  return <Outlet />;
}
