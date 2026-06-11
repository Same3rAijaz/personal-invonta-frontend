import { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box } from "@mui/material";
import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import SuperAdminOnlyRoute from "./routes/SuperAdminOnlyRoute";
import BusinessUserRoute from "./routes/BusinessUserRoute";
import CustomLoader from "./components/CustomLoader";
import * as Pages from "./routes/lazyPages";

function RouteFallback() {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        bgcolor: (theme) => (theme.palette.mode === "dark" ? "#0a0f1e" : "#f8fafc"),
      }}
    >
      <CustomLoader />
    </Box>
  );
}
export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/subscription-blocked" element={<Pages.SubscriptionBlocked />} />
        <Route path="/login" element={<Pages.Login />} />
        <Route path="/signup" element={<Pages.Signup />} />
        <Route path="/forgot-password" element={<Pages.ForgotPassword />} />
        <Route path="/reset-password" element={<Pages.ResetPassword />} />
        <Route path="/privacy" element={<Pages.Privacy />} />
        <Route path="/terms" element={<Pages.Terms />} />
        <Route path="/tutorial" element={<Pages.Tutorial />} />
        <Route path="/marketplace" element={<Pages.Marketplace />} />
        <Route path="/marketplace/favorites" element={<Pages.Favorites />} />
        <Route path="/marketplace/products/:seo" element={<Pages.MarketplaceProductDetail />} />
        <Route path="/marketplace/markets/:seo" element={<Pages.MarketplaceMarketDetail />} />
        <Route path="/:shopSlug" element={<Pages.MarketplaceShopDetail />} />
        <Route path="/marketplace/:shopSlug" element={<Pages.MarketplaceShopDetail />} />
        <Route path="/marketplace/shops/:seo" element={<Pages.MarketplaceShopDetail />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route element={<BusinessUserRoute />}>
              <Route index element={<Pages.Dashboard />} />
              <Route path="/products" element={<Pages.Products />} />
              <Route path="/products/new" element={<Pages.ProductCreate />} />
              <Route path="/products/:id" element={<Pages.ProductView />} />
              <Route path="/products/:id/edit" element={<Pages.ProductEdit />} />
              <Route path="/inventory" element={<Pages.Inventory />} />
              <Route path="/inventory/new" element={<Pages.InventoryCreate />} />
              <Route path="/warehouses" element={<Pages.Warehouses />} />
              <Route path="/warehouses/new" element={<Pages.WarehouseCreate />} />
              <Route path="/warehouses/:id/edit" element={<Pages.WarehouseEdit />} />
              <Route path="/locations" element={<Pages.Locations />} />
              <Route path="/locations/new" element={<Pages.LocationCreate />} />
              <Route path="/locations/:id/edit" element={<Pages.LocationEdit />} />
              <Route path="/customers" element={<Pages.Customers />} />
              <Route path="/customers/new" element={<Pages.CustomerCreate />} />
              <Route path="/customers/:id/edit" element={<Pages.CustomerEdit />} />
              <Route path="/vendors" element={<Pages.Vendors />} />
              <Route path="/vendors/new" element={<Pages.VendorCreate />} />
              <Route path="/vendors/:id/edit" element={<Pages.VendorEdit />} />
              <Route path="/purchasing" element={<Pages.Purchasing />} />
              <Route path="/purchasing/new" element={<Pages.PurchaseOrderCreate />} />
              <Route path="/purchasing/:id/edit" element={<Pages.PurchaseOrderEdit />} />
              <Route path="/sales" element={<Pages.Sales />} />
              <Route path="/sales/new" element={<Pages.SalesOrderCreate />} />
              <Route path="/sales/:id/edit" element={<Pages.SalesOrderEdit />} />
              <Route path="/sales/returns" element={<Pages.SalesReturns />} />
              <Route path="/sales/returns/new" element={<Pages.SalesReturnCreate />} />
              <Route path="/sales/returns/:id" element={<Pages.SalesReturnDetail />} />
              <Route path="/borrows" element={<Pages.BorrowOrders />} />
              <Route path="/borrows/new" element={<Pages.BorrowOrderCreate />} />
              <Route path="/borrows/:id" element={<Pages.BorrowOrderDetail />} />
              <Route path="/partners" element={<Pages.Partners />} />
              <Route path="/network" element={<Pages.Network />} />
              <Route path="/chat" element={<Pages.Chat />} />
              <Route path="/borrows/profit-report" element={<Pages.BorrowProfitReport />} />
              <Route path="/shop-friends" element={<Pages.ShopFriends />} />
              <Route path="/shop-discover" element={<Pages.ShopDiscover />} />
              <Route path="/employees" element={<Pages.Employees />} />
              <Route path="/employees/new" element={<Pages.EmployeeCreate />} />
              <Route path="/employees/:id/edit" element={<Pages.EmployeeEdit />} />
              <Route path="/attendance" element={<Pages.Attendance />} />
              <Route path="/attendance/new" element={<Pages.AttendanceCreate />} />
              <Route path="/attendance/:id/edit" element={<Pages.AttendanceEdit />} />
              <Route path="/leaves" element={<Pages.Leaves />} />
              <Route path="/payroll" element={<Pages.Payroll />} />
              <Route path="/reports" element={<Pages.Reports />} />
              <Route path="/notifications" element={<Pages.Notifications />} />
              <Route path="/udhaar/parties" element={<Pages.UdhaarParties />} />
              <Route path="/udhaar/parties/:id" element={<Pages.PartyDetail />} />
              <Route path="/udhaar/reports" element={<Pages.UdhaarReports />} />
              <Route path="/settings/profile" element={<Pages.BusinessProfile />} />
              <Route path="/referrals" element={<Pages.MyReferrals />} />
            </Route>
            <Route element={<SuperAdminOnlyRoute />}>
              <Route path="/superadmin/markets" element={<Pages.Markets />} />
              <Route path="/superadmin/markets/new" element={<Pages.MarketCreate />} />
              <Route path="/superadmin/markets/:id/edit" element={<Pages.MarketEdit />} />
              <Route path="/superadmin/categories" element={<Pages.Categories />} />
              <Route path="/superadmin/categories/new" element={<Pages.CategoryCreate />} />
              <Route path="/superadmin/categories/:id/edit" element={<Pages.CategoryEdit />} />
              <Route path="/superadmin/businesses" element={<Pages.Businesses />} />
              <Route path="/superadmin/businesses/new" element={<Pages.BusinessCreate />} />
              <Route path="/superadmin/businesses/:id/edit" element={<Pages.BusinessEdit />} />
              <Route path="/superadmin/requests" element={<Pages.ShopRequests />} />
              <Route path="/superadmin/invitations" element={<Pages.Invitations />} />
              <Route path="/referrals/settings" element={<Pages.ReferralSettings />} />
              <Route path="/superadmin/transactions" element={<Pages.Transactions />} />
              <Route path="/superadmin/subscription-status" element={<Pages.SubscriptionStatus />} />
              <Route path="/superadmin/monthly-billing" element={<Pages.MonthlyBilling />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
}
