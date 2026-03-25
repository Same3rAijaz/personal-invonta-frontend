import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function BusinessUserRoute() {
  const { user, business } = useAuth();
  if (user?.role === "SUPER_ADMIN") return <Navigate to="/superadmin/businesses" replace />;
  // Gate business admins behind subscription paywall
  if (
    user?.role === "ADMIN" &&
    business &&
    business.subscriptionStatus !== "active"
  ) {
    return <Navigate to="/subscription" replace />;
  }
  return <Outlet />;
}
