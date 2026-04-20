import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductCreate from "./pages/products/ProductCreate";
import ProductEdit from "./pages/products/ProductEdit";
import ProductView from "./pages/products/ProductView";
import Warehouses from "./pages/Warehouses";
import WarehouseCreate from "./pages/warehouses/WarehouseCreate";
import WarehouseEdit from "./pages/warehouses/WarehouseEdit";
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
import Reports from "./pages/reports/Reports";
import Markets from "./pages/superadmin/Markets";
import MarketCreate from "./pages/superadmin/MarketCreate";
import MarketEdit from "./pages/superadmin/MarketEdit";
import Categories from "./pages/superadmin/Categories";
import CategoryCreate from "./pages/superadmin/CategoryCreate";
import CategoryEdit from "./pages/superadmin/CategoryEdit";
import Businesses from "./pages/superadmin/Businesses";
import BusinessCreate from "./pages/superadmin/BusinessCreate";
import BusinessEdit from "./pages/superadmin/BusinessEdit";
import MyReferrals from "./pages/referrals/MyReferrals";
import ReferralSettings from "./pages/referrals/ReferralSettings";
import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import SuperAdminOnlyRoute from "./routes/SuperAdminOnlyRoute";
import BusinessUserRoute from "./routes/BusinessUserRoute";
import BusinessProfile from "./pages/settings/BusinessProfile";
import Signup from "./pages/Signup";
import ShopRequests from "./pages/superadmin/ShopRequests";
import Privacy from "./pages/public/Privacy";
import Terms from "./pages/public/Terms";
import Tutorial from "./pages/public/Tutorial";
import Marketplace from "./pages/public/Marketplace";
import MarketplaceProductDetail from "./pages/public/MarketplaceProductDetail";
import MarketplaceShopDetail from "./pages/public/MarketplaceShopDetail";
import MarketplaceMarketDetail from "./pages/public/MarketplaceMarketDetail";
import Favorites from "./pages/public/Favorites";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Notifications from "./pages/Notifications";
import UdhaarParties from "./pages/udhaar/Parties";
import PartyDetail from "./pages/udhaar/PartyDetail";
import UdhaarReports from "./pages/udhaar/Reports";
import Transactions from "./pages/superadmin/Transactions";
import SubscriptionStatus from "./pages/superadmin/SubscriptionStatus";
import BorrowOrders from "./pages/borrows/BorrowOrders";
import BorrowOrderCreate from "./pages/borrows/BorrowOrderCreate";
import BorrowOrderDetail from "./pages/borrows/BorrowOrderDetail";
import BorrowProfitReport from "./pages/borrows/BorrowProfitReport";
import SalesReturns from "./pages/sales/SalesReturns";
import SalesReturnCreate from "./pages/sales/SalesReturnCreate";
import SalesReturnDetail from "./pages/sales/SalesReturnDetail";
import ShopFriends from "./pages/friends/ShopFriends";
import ShopDiscover from "./pages/friends/ShopDiscover";
import Partners from "./pages/Partners";
import Network from "./pages/Network";
import Chat from "./pages/Chat";

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
      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/marketplace/favorites" element={<Favorites />} />
      <Route path="/marketplace/products/:seo" element={<MarketplaceProductDetail />} />
      <Route path="/marketplace/markets/:seo" element={<MarketplaceMarketDetail />} />
      <Route path="/:shopSlug" element={<MarketplaceShopDetail />} />
      <Route path="/marketplace/:shopSlug" element={<MarketplaceShopDetail />} />
      <Route path="/marketplace/shops/:seo" element={<MarketplaceShopDetail />} />
      <Route element={<ProtectedRoute />}
      >
        <Route element={<AppLayout />}>
          <Route element={<BusinessUserRoute />}>
            <Route index element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/new" element={<ProductCreate />} />
            <Route path="/products/:id" element={<ProductView />} />
            <Route path="/products/:id/edit" element={<ProductEdit />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/inventory/new" element={<InventoryCreate />} />
            <Route path="/warehouses" element={<Warehouses />} />
            <Route path="/warehouses/new" element={<WarehouseCreate />} />
            <Route path="/warehouses/:id/edit" element={<WarehouseEdit />} />
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
            <Route path="/sales/returns" element={<SalesReturns />} />
            <Route path="/sales/returns/new" element={<SalesReturnCreate />} />
            <Route path="/sales/returns/:id" element={<SalesReturnDetail />} />
            <Route path="/borrows" element={<BorrowOrders />} />
            <Route path="/borrows/new" element={<BorrowOrderCreate />} />
            <Route path="/borrows/:id" element={<BorrowOrderDetail />} />
            <Route path="/partners" element={<Partners />} />
            <Route path="/network" element={<Network />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/borrows/profit-report" element={<BorrowProfitReport />} />
            <Route path="/shop-friends" element={<ShopFriends />} />
            <Route path="/shop-discover" element={<ShopDiscover />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/employees/new" element={<EmployeeCreate />} />
            <Route path="/employees/:id/edit" element={<EmployeeEdit />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/udhaar/parties" element={<UdhaarParties />} />
            <Route path="/udhaar/parties/:id" element={<PartyDetail />} />
            <Route path="/udhaar/reports" element={<UdhaarReports />} />
            <Route path="/settings/profile" element={<BusinessProfile />} />
            <Route path="/referrals" element={<MyReferrals />} />
          </Route>
          <Route element={<SuperAdminOnlyRoute />}>
            <Route path="/superadmin/markets" element={<Markets />} />
            <Route path="/superadmin/markets/new" element={<MarketCreate />} />
            <Route path="/superadmin/markets/:id/edit" element={<MarketEdit />} />
            <Route path="/superadmin/categories" element={<Categories />} />
            <Route path="/superadmin/categories/new" element={<CategoryCreate />} />
            <Route path="/superadmin/categories/:id/edit" element={<CategoryEdit />} />
            <Route path="/superadmin/businesses" element={<Businesses />} />
            <Route path="/superadmin/businesses/new" element={<BusinessCreate />} />
            <Route path="/superadmin/businesses/:id/edit" element={<BusinessEdit />} />
            <Route path="/superadmin/requests" element={<ShopRequests />} />
            <Route path="/referrals/settings" element={<ReferralSettings />} />
            <Route path="/superadmin/transactions" element={<Transactions />} />
            <Route path="/superadmin/subscription-status" element={<SubscriptionStatus />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}


