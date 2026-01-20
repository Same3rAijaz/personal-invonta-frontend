import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductCreate from "./pages/products/ProductCreate";
import ProductEdit from "./pages/products/ProductEdit";
import Warehouses from "./pages/Warehouses";
import WarehouseCreate from "./pages/warehouses/WarehouseCreate";
import WarehouseEdit from "./pages/warehouses/WarehouseEdit";
import Locations from "./pages/Locations";
import LocationCreate from "./pages/locations/LocationCreate";
import LocationEdit from "./pages/locations/LocationEdit";
import Customers from "./pages/Customers";
import CustomerCreate from "./pages/customers/CustomerCreate";
import CustomerEdit from "./pages/customers/CustomerEdit";
import Vendors from "./pages/Vendors";
import VendorCreate from "./pages/vendors/VendorCreate";
import VendorEdit from "./pages/vendors/VendorEdit";
import Purchasing from "./pages/purchasing/PurchaseOrders";
import PurchaseOrderCreate from "./pages/purchasing/PurchaseOrderCreate";
import PurchaseOrderEdit from "./pages/purchasing/PurchaseOrderEdit";
import Inventory from "./pages/inventory/Inventory";
import InventoryCreate from "./pages/inventory/InventoryCreate";
import Sales from "./pages/sales/SalesOrders";
import SalesOrderCreate from "./pages/sales/SalesOrderCreate";
import SalesOrderEdit from "./pages/sales/SalesOrderEdit";
import Employees from "./pages/Employees";
import EmployeeCreate from "./pages/employees/EmployeeCreate";
import EmployeeEdit from "./pages/employees/EmployeeEdit";
import Attendance from "./pages/attendance/Attendance";
import AttendanceCreate from "./pages/attendance/AttendanceCreate";
import Reports from "./pages/reports/Reports";
import Markets from "./pages/superadmin/Markets";
import MarketCreate from "./pages/superadmin/MarketCreate";
import MarketEdit from "./pages/superadmin/MarketEdit";
import Businesses from "./pages/superadmin/Businesses";
import BusinessCreate from "./pages/superadmin/BusinessCreate";
import BusinessEdit from "./pages/superadmin/BusinessEdit";
import MyReferrals from "./pages/referrals/MyReferrals";
import ReferralSettings from "./pages/referrals/ReferralSettings";
import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import BusinessProfile from "./pages/settings/BusinessProfile";
import Signup from "./pages/Signup";
import ShopRequests from "./pages/superadmin/ShopRequests";
import Privacy from "./pages/public/Privacy";
import Terms from "./pages/public/Terms";
import Tutorial from "./pages/public/Tutorial";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Notifications from "./pages/Notifications";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/tutorial" element={<Tutorial />} />
      <Route element={<ProtectedRoute />}
      >
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/new" element={<ProductCreate />} />
          <Route path="/products/:id/edit" element={<ProductEdit />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/inventory/new" element={<InventoryCreate />} />
          <Route path="/warehouses" element={<Warehouses />} />
          <Route path="/warehouses/new" element={<WarehouseCreate />} />
          <Route path="/warehouses/:id/edit" element={<WarehouseEdit />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/locations/new" element={<LocationCreate />} />
          <Route path="/locations/:id/edit" element={<LocationEdit />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/new" element={<CustomerCreate />} />
          <Route path="/customers/:id/edit" element={<CustomerEdit />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/vendors/new" element={<VendorCreate />} />
          <Route path="/vendors/:id/edit" element={<VendorEdit />} />
          <Route path="/purchasing" element={<Purchasing />} />
          <Route path="/purchasing/new" element={<PurchaseOrderCreate />} />
          <Route path="/purchasing/:id/edit" element={<PurchaseOrderEdit />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/sales/new" element={<SalesOrderCreate />} />
          <Route path="/sales/:id/edit" element={<SalesOrderEdit />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/employees/new" element={<EmployeeCreate />} />
          <Route path="/employees/:id/edit" element={<EmployeeEdit />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/attendance/new" element={<AttendanceCreate />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/superadmin/markets" element={<Markets />} />
          <Route path="/superadmin/markets/new" element={<MarketCreate />} />
          <Route path="/superadmin/markets/:id/edit" element={<MarketEdit />} />
          <Route path="/superadmin/businesses" element={<Businesses />} />
          <Route path="/superadmin/businesses/new" element={<BusinessCreate />} />
          <Route path="/superadmin/businesses/:id/edit" element={<BusinessEdit />} />
          <Route path="/superadmin/requests" element={<ShopRequests />} />
          <Route path="/settings/profile" element={<BusinessProfile />} />
          <Route path="/referrals" element={<MyReferrals />} />
          <Route path="/referrals/settings" element={<ReferralSettings />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
