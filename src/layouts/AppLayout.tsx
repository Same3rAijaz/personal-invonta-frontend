import React from "react";
import { AppBar, Toolbar, Typography, Box, Drawer, List, ListItemButton, ListItemText, IconButton } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const drawerWidth = 220;
export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const location = useLocation();
  const { logout, user, business } = useAuth();
  const moduleMap: Record<string, string[]> = {
    products: ["products"],
    inventory: ["inventory"],
    warehouses: ["warehouses"],
    locations: ["locations"],
    customers: ["customers"],
    vendors: ["vendors"],
    purchasing: ["purchasing"],
    sales: ["sales"],
    employees: ["hr"],
    attendance: ["hr"],
    reports: ["reports"],
    udhaar: ["udhaar"]
  };
  const businessModules = business?.enabledModules || [];
  const userModules = user?.allowedModules || [];
  const hasBusinessLimit = businessModules.length > 0;
  const hasUserLimit = userModules.length > 0 && user?.role !== "ADMIN";
  const isAllowed = (key: string) => {
    if (user?.role === "SUPER_ADMIN") return true;
    const mapped = moduleMap[key] || [];
    const businessPass = !hasBusinessLimit || mapped.some((m) => businessModules.includes(m));
    const userPass = !hasUserLimit || mapped.some((m) => userModules.includes(m));
    return businessPass && userPass;
  };

  const navItems = [
    { label: "Dashboard", to: "/" },
    ...(isAllowed("products") ? [{ label: "Products", to: "/products" }] : []),
    ...(isAllowed("inventory") ? [{ label: "Inventory", to: "/inventory" }] : []),
    ...(isAllowed("warehouses") ? [{ label: "Warehouses", to: "/warehouses" }] : []),
    ...(isAllowed("locations") ? [{ label: "Locations", to: "/locations" }] : []),
    ...(isAllowed("customers") ? [{ label: "Customers", to: "/customers" }] : []),
    ...(isAllowed("vendors") ? [{ label: "Vendors", to: "/vendors" }] : []),
    ...(isAllowed("purchasing") ? [{ label: "Purchasing", to: "/purchasing" }] : []),
    ...(isAllowed("sales") ? [{ label: "Sales", to: "/sales" }] : []),
    ...(isAllowed("employees") ? [{ label: "Employees", to: "/employees" }] : []),
    ...(isAllowed("attendance") ? [{ label: "Attendance", to: "/attendance" }] : []),
    ...(isAllowed("reports") ? [{ label: "Reports", to: "/reports" }] : []),
    ...(isAllowed("udhaar") ? [{ label: "Udhaar", to: "/udhaar/parties" }] : []),
    ...(isAllowed("udhaar") ? [{ label: "Udhaar Reports", to: "/udhaar/reports" }] : []),
    { label: "Notifications", to: "/notifications" },
    { label: "My Referrals", to: "/referrals" },
    ...(user?.role === "SUPER_ADMIN" ? [{ label: "Referral Settings", to: "/referrals/settings" }] : []),
    ...(user?.role === "ADMIN" ? [{ label: "Settings", to: "/settings/profile" }] : [])
  ];
  if (user?.role === "SUPER_ADMIN") {
    navItems.push({ label: "Markets", to: "/superadmin/markets" });
    navItems.push({ label: "Businesses", to: "/superadmin/businesses" });
    navItems.push({ label: "Requests", to: "/superadmin/requests" });
  }

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6">Invonta</Typography>
      </Toolbar>
      <List>
        {navItems.map((item) => (
          <ListItemButton
            key={item.to}
            component={Link}
            to={item.to}
            selected={location.pathname === item.to}
          >
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
        <ListItemButton onClick={logout}>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ zIndex: 1201, background: "linear-gradient(90deg, #0f172a 0%, #1f2937 100%)" }}>
      <Toolbar>
        <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2, display: { sm: "none" } }}>
          <MenuIcon />
        </IconButton>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <img src="/Invonta.png" alt="Invonta" style={{ width: 28, height: 28 }} />
          <Typography variant="h6">Invonta</Typography>
        </Box>
      </Toolbar>
    </AppBar>
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", sm: "none" }, "& .MuiDrawer-paper": { width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: "none", sm: "block" }, "& .MuiDrawer-paper": { width: drawerWidth } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          minHeight: "100vh",
          background: "radial-gradient(circle at top, #eef2ff 0%, #f8fafc 45%, #f1f5f9 100%)"
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}


