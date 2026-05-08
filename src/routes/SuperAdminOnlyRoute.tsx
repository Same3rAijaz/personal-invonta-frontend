import { Navigate, Outlet } from "react-router-dom";
import { useAuth, getRoleFromToken } from "../hooks/useAuth";

/**
 * SuperAdmin guard.
 *
 * BUG-011: previously read `user.role` from localStorage, which is trivially
 * tamper-able from DevTools. We still keep that as a fast pre-check so an
 * untrusted state doesn't render SuperAdmin-only chrome, but the source of
 * truth is the role claim inside the JWT itself. Even with a forged
 * `localStorage.user`, an attacker cannot mint a valid JWT, so the API
 * (which is the actual authority) will continue rejecting their requests.
 *
 * This component now requires BOTH the localStorage role AND the JWT role
 * to say SUPER_ADMIN before rendering.
 */
export default function SuperAdminOnlyRoute() {
  const { user, token } = useAuth();
  const tokenRole = getRoleFromToken(token);
  const isSuperAdmin = user?.role === "SUPER_ADMIN" && tokenRole === "SUPER_ADMIN";
  if (!isSuperAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}
