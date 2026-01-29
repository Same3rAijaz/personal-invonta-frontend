import React from "react";
import { AppBar, Toolbar, Typography, Box, Drawer, List, ListItemButton, ListItemText, IconButton, Divider, Avatar, Stack, Menu, MenuItem, ListItemIcon, ListSubheader } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const drawerWidth = 248;
export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const location = useLocation();
  const { logout, user, business } = useAuth();
  const displayName = user?.name || user?.fullName || user?.email || "Account";
  const initials = String(displayName)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0])
    .join("")
    .toUpperCase();
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
    reports: ["reports"]
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
    { label: "Notifications", to: "/notifications" },
    { label: "My Referrals", to: "/referrals" },
    ...(user?.role === "SUPER_ADMIN" ? [{ label: "Referral Settings", to: "/referrals/settings" }] : []),
    ...(user?.role === "ADMIN" ? [{ label: "Settings", to: "/settings/profile" }] : [])
  ];
  if (user?.role === "SUPER_ADMIN") {
    navItems.push({ label: "Markets", to: "/superadmin/markets" });
    navItems.push({ label: "Businesses", to: "/superadmin/businesses" });
    navItems.push({ label: "Approval Requests", to: "/superadmin/requests" });
  }

  const isActive = (path: string) => (path === "/" ? location.pathname === "/" : location.pathname.startsWith(path));
  const menuOpen = Boolean(menuAnchor);

  const drawer = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ px: 2.5, py: 2.5, display: "flex", alignItems: "center", gap: 1.5, borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
        <Box component="img" src="/Invonta.png" alt="Invonta" sx={{ width: 32, height: 32 }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#ffffff", lineHeight: 1.1 }}>Invonta</Typography>
          <Typography variant="caption" sx={{ color: "rgba(226,232,240,0.7)" }}>Operations Suite</Typography>
        </Box>
      </Box>
      <List
        sx={{ px: 1.5, py: 1.5, flexGrow: 1 }}
        subheader={
          <ListSubheader
            disableSticky
            sx={{
              bgcolor: "transparent",
              color: "rgba(148,163,184,0.8)",
              textTransform: "uppercase",
              letterSpacing: 1.2,
              fontSize: "0.68rem",
              fontWeight: 700,
              px: 0,
              pb: 1
            }}
          >
            Navigation
          </ListSubheader>
        }
      >
        {navItems.map((item) => (
          <ListItemButton
            key={item.to}
            component={Link}
            to={item.to}
            selected={isActive(item.to)}
            sx={{
              borderRadius: 0,
              mb: 0.6,
              px: 1.5,
              py: 1,
              fontSize: 14,
              color: "rgba(226,232,240,0.82)",
              position: "relative",
              "&.Mui-selected": {
                backgroundColor: "rgba(14,165,233,0.18)",
                color: "#ffffff"
              },
              "&.Mui-selected::before": {
                content: "\"\"",
                position: "absolute",
                left: 6,
                top: 8,
                bottom: 8,
                width: 3,
                borderRadius: 999,
                backgroundColor: "#38bdf8"
              },
              "&.Mui-selected:hover": {
                backgroundColor: "rgba(14,165,233,0.18)"
              }
            }}
          >
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ px: 1.5, pb: 2 }}>
        <ListItemButton
          onClick={logout}
          sx={{
            borderRadius: 2,
            px: 1.5,
            py: 1,
            color: "rgba(226,232,240,0.82)"
          }}
        >
          <ListItemText primary="Logout" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: 1201,
          background: "rgba(11,18,32,0.92)",
          backdropFilter: "blur(14px)",
          boxShadow: "0 12px 30px rgba(15,23,42,0.18)",
          borderBottom: "1px solid rgba(148,163,184,0.2)"
        }}
      >
        <Toolbar sx={{ minHeight: 68 }}>
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2, display: { sm: "none" } }}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box component="img" src="/Invonta.png" alt="Invonta" sx={{ width: 30, height: 30 }} />
            <Typography variant="h6">Invonta</Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="caption" sx={{ color: "rgba(226,232,240,0.7)", display: "block" }}>
                {business?.name || "Your Workspace"}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#ffffff" }}>
                {displayName}
              </Typography>
            </Box>
            <IconButton onClick={(event) => setMenuAnchor(event.currentTarget)} sx={{ p: 0.4, borderRadius: 1 }}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Avatar
                  sx={{
                    bgcolor: "rgba(14,165,233,0.9)",
                    color: "#ffffff",
                    width: 34,
                    height: 34,
                    fontSize: 13
                  }}
                >
                  {initials}
                </Avatar>
                <ArrowDropDownIcon sx={{ color: "rgba(226,232,240,0.75)" }} />
              </Stack>
            </IconButton>
            <Menu
              anchorEl={menuAnchor}
              open={menuOpen}
              onClose={() => setMenuAnchor(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              PaperProps={{ sx: { borderRadius: 0, minWidth: 160 } }}
            >
              <MenuItem component={Link} to="/settings/profile" onClick={() => setMenuAnchor(null)}>
                <ListItemIcon sx={{ minWidth: 34 }}>
                  <AccountCircleIcon fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>
              <Divider />
              <MenuItem
                onClick={() => {
                  setMenuAnchor(null);
                  logout();
                }}
              >
                <ListItemIcon sx={{ minWidth: 34 }}>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Stack>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              background: "linear-gradient(180deg, #0b1220 0%, #111827 100%)",
              color: "#e2e8f0"
            }
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              background: "linear-gradient(180deg, #0b1220 0%, #111827 100%)",
              color: "#e2e8f0"
            }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          px: { xs: 2, md: 4 },
          py: { xs: 3, md: 4 },
          mt: 9,
          minHeight: "100vh",
          background: "radial-gradient(circle at top, #eff6ff 0%, #f8fafc 40%, #eef2f7 100%)",
          animation: "fadeInUp 420ms ease"
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
