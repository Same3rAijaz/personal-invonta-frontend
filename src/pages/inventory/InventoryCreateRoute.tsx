import { Navigate, useLocation } from "react-router-dom";

/** Legacy/direct URL support — opens create flow on the inventory list via drawer. */
export default function InventoryCreateRoute() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  params.set("openCreate", "1");
  return <Navigate to={`/inventory?${params.toString()}`} replace />;
}
