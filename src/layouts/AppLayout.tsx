import React from "react";
import { AppBar, Toolbar, Typography, Box, Drawer, List, ListItemButton, ListItemText, IconButton, Divider, Avatar, Stack, Menu, MenuItem, ListItemIcon, ListSubheader, Collapse, Modal, Button, CircularProgress, Paper } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { api } from "../api/client";
import { useToast } from "../hooks/useToast";

const drawerWidth = 248;
type NavItem = { label: string; to: string };
type NavGroup = { id: string; label: string; items: NavItem[] };
export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const location = useLocation();
  const { logout, user, business } = useAuth();
  const { notify } = useToast();
  const [subLoading, setSubLoading] = React.useState(false);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const showPaywall = !isSuperAdmin && business && business.subscriptionStatus !== "active" && business.subscriptionStatus !== "pending";

  const handleSubscribe = async () => {
    setSubLoading(true);
    try {
      const { data } = await api.post("/subscriptions/checkout");
      const url = data?.data?.url || data?.url;
      if (url) {
        window.location.href = url;
      } else {
        notify("Failed to create checkout session", "error");
      }
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Payment initiation failed", "error");
    } finally {
      setSubLoading(false);
    }
  };

  const rawDisplayName = user?.name || user?.fullName || user?.email || "Account";
  const displayName = String(rawDisplayName)
    .split(" ")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
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
    customers: ["customers"],
    vendors: ["vendors"],
    purchasing: ["purchasing"],
    sales: ["sales"],
    employees: ["hr"],
    reports: ["reports"],
    udhaar: ["udhaar"]
  };
  const businessModules = business?.enabledModules || [];
  const userModules = user?.allowedModules || [];
  const hasBusinessLimit = businessModules.length > 0;
  const hasUserLimit = userModules.length > 0 && user?.role !== "ADMIN";
  const isAllowed = (key: string) => {
    if (isSuperAdmin) return false;
    const mapped = moduleMap[key] || [];
    const businessPass = !hasBusinessLimit || mapped.some((m) => businessModules.includes(m));
    const userPass = !hasUserLimit || mapped.some((m) => userModules.includes(m));
    return businessPass && userPass;
  };

  const directNavItems: NavItem[] = [{ label: "Dashboard", to: "/" }];
  const navGroups: NavGroup[] = isSuperAdmin
    ? [
        {
          id: "platform",
          label: "Platform",
          items: [
            { label: "Markets", to: "/superadmin/markets" },
            { label: "Businesses", to: "/superadmin/businesses" },
            { label: "Categories", to: "/superadmin/categories" },
            { label: "Approval Requests", to: "/superadmin/requests" },
            { label: "Transactions", to: "/superadmin/transactions" }
          ]
        },
        {
          id: "referrals",
          label: "Referrals",
          items: [{ label: "Referral Settings", to: "/referrals/settings" }]
        }
      ]
    : [
        {
          id: "operations",
          label: "Operations",
          items: [
            ...(isAllowed("products") ? [{ label: "Products", to: "/products" }] : []),
            ...(isAllowed("inventory") ? [{ label: "Inventory", to: "/inventory" }] : []),
            ...(isAllowed("warehouses") ? [{ label: "Warehouses", to: "/warehouses" }] : []),
            ...(isAllowed("purchasing") ? [{ label: "Purchasing", to: "/purchasing" }] : []),
            ...(isAllowed("sales") ? [{ label: "Sales", to: "/sales" }] : []),
            ...(isAllowed("sales") ? [{ label: "Sales Returns", to: "/sales/returns" }] : []),
            ...(isAllowed("sales") ? [{ label: "Stock Loans", to: "/borrows" }] : [])
          ]
        },
        {
          id: "people",
          label: "People",
          items: [
            ...(isAllowed("employees") ? [{ label: "Employees", to: "/employees" }] : [])
          ]
        },
        {
          id: "partners",
          label: "Partners",
          items: [
            ...(isAllowed("customers") ? [{ label: "Customers", to: "/customers" }] : []),
            ...(isAllowed("vendors") ? [{ label: "Vendors", to: "/vendors" }] : []),
            { label: "Shop Friends", to: "/shop-friends" },
            { label: "Discover Shops", to: "/shop-discover" }
          ]
        },
        {
          id: "analytics",
          label: "Analytics",
          items: [
            ...(isAllowed("reports") ? [{ label: "Reports", to: "/reports" }] : []),
            ...(isAllowed("sales") ? [{ label: "Loan Profit Report", to: "/borrows/profit-report" }] : []),
            ...(isAllowed("udhaar") ? [{ label: "Udhaar", to: "/udhaar/parties" }] : []),
            ...(isAllowed("udhaar") ? [{ label: "Udhaar Reports", to: "/udhaar/reports" }] : [])
          ]
        },
        {
          id: "account",
          label: "Account",
          items: [
            { label: "Notifications", to: "/notifications" },
            { label: "My Referrals", to: "/referrals" },
            ...(user?.role === "ADMIN" ? [{ label: "Settings", to: "/settings/profile" }] : [])
          ]
        }
      ];
  const filteredNavGroups = navGroups.filter((group) => group.items.length > 0);

  const allNavPaths = [
    ...directNavItems.map((i) => i.to),
    ...filteredNavGroups.flatMap((g) => g.items.map((i) => i.to))
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    if (location.pathname === path) return true;
    if (!location.pathname.startsWith(path + "/")) return false;
    // Don't highlight a parent if a more-specific nav item already matches
    const moreSpecificMatch = allNavPaths.some(
      (p) => p !== path && p.startsWith(path + "/") &&
        (location.pathname === p || location.pathname.startsWith(p + "/"))
    );
    return !moreSpecificMatch;
  };
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({});
  React.useEffect(() => {
    setOpenGroups((prev) => {
      const next: Record<string, boolean> = {};
      let changed = false;
      for (const group of filteredNavGroups) {
        const hasActiveChild = group.items.some((item) => isActive(item.to));
        const current = prev[group.id];
        const value = current !== undefined ? current : hasActiveChild;
        next[group.id] = value;
        if (current === undefined || value !== current) changed = true;
      }
      if (Object.keys(prev).length !== Object.keys(next).length) changed = true;
      return changed ? next : prev;
    });
  }, [filteredNavGroups, location.pathname]);

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
        {directNavItems.map((item) => (
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
        {filteredNavGroups.map((group) => {
          const groupActive = group.items.some((item) => isActive(item.to));
          return (
            <React.Fragment key={group.id}>
              <ListItemButton
                onClick={() => setOpenGroups((prev) => ({ ...prev, [group.id]: !prev[group.id] }))}
                sx={{
                  borderRadius: 0,
                  mt: 0.4,
                  mb: 0.2,
                  px: 1.2,
                  py: 0.8,
                  color: groupActive ? "#ffffff" : "rgba(226,232,240,0.8)"
                }}
              >
                <ListItemText
                  primary={group.label}
                  primaryTypographyProps={{
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.7
                  }}
                />
                {openGroups[group.id] ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </ListItemButton>
              <Collapse in={Boolean(openGroups[group.id])} timeout="auto" unmountOnExit>
                {group.items.map((item) => (
                  <ListItemButton
                    key={item.to}
                    component={Link}
                    to={item.to}
                    selected={isActive(item.to)}
                    sx={{
                      borderRadius: 0,
                      mb: 0.5,
                      ml: 1,
                      px: 1.5,
                      py: 0.9,
                      fontSize: 13,
                      color: "rgba(226,232,240,0.78)",
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
              </Collapse>
            </React.Fragment>
          );
        })}
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
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2, display: { md: "none" } }}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box component="img" src="/Invonta.png" alt="Invonta" sx={{ width: 30, height: 30 }} />
            <Typography variant="h6">Invonta</Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}>
              <Typography variant="caption" sx={{ color: "rgba(226,232,240,0.7)", display: "block" }}>
                {isSuperAdmin ? "Super Admin Workspace" : (business?.name || "Your Workspace")}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#ffffff" }}>
                {displayName}
              </Typography>
            </Box>
            <IconButton onClick={(event) => setMenuAnchor(event.currentTarget)} sx={{ p: 0.4, borderRadius: 1 }}>
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
            </IconButton>
            <Menu
              anchorEl={menuAnchor}
              open={menuOpen}
              onClose={() => setMenuAnchor(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              PaperProps={{ sx: { borderRadius: 0, minWidth: 160 } }}
            >
              {!isSuperAdmin ? (
                <MenuItem component={Link} to="/settings/profile" onClick={() => setMenuAnchor(null)}>
                  <ListItemIcon sx={{ minWidth: 34 }}>
                    <AccountCircleIcon fontSize="small" />
                  </ListItemIcon>
                  Profile
                </MenuItem>
              ) : null}
              {!isSuperAdmin ? <Divider /> : null}
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
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
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
            display: { xs: "none", md: "block" },
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
          minWidth: 0,
          width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 2.5, sm: 3, md: 4 },
          mt: { xs: "68px", md: "68px" },
          minHeight: "100vh",
          overflowX: "hidden",
          background: "radial-gradient(circle at top, #eff6ff 0%, #f8fafc 40%, #eef2f7 100%)",
          animation: "fadeInUp 420ms ease"
        }}
      >
        <Outlet />
      </Box>

      {/* Subscription paywall modal — locks entire UI */}
      {showPaywall && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(8px)"
          }}
        >
          <Paper
            elevation={0}
            sx={{
              maxWidth: 480,
              width: "90%",
              p: { xs: 3, md: 5 },
              borderRadius: 3,
              textAlign: "center",
              background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.3)"
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2.5,
                boxShadow: "0 8px 24px rgba(14,165,233,0.3)"
              }}
            >
              <LockOutlinedIcon sx={{ color: "#fff", fontSize: 32 }} />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", mb: 0.5 }}>
              Subscription Required
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b", mb: 3 }}>
              Activate your plan to unlock all features
            </Typography>

            <Box
              sx={{
                p: 2.5,
                borderRadius: 2,
                border: "2px solid rgba(14,165,233,0.15)",
                background: "linear-gradient(135deg, rgba(14,165,233,0.04) 0%, rgba(99,102,241,0.04) 100%)",
                mb: 3
              }}
            >
              <Typography variant="overline" sx={{ color: "#6366f1", fontWeight: 700, letterSpacing: 1.5 }}>
                Monthly Plan
              </Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 0.5, mt: 0.5 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a" }}>₨5,000</Typography>
                <Typography variant="body2" sx={{ color: "#94a3b8" }}>/month</Typography>
              </Box>
              <Box sx={{ mt: 1.5, textAlign: "left" }}>
                <Typography variant="body2" sx={{ color: "#475569", py: 0.3 }}>✓ Full dashboard access</Typography>
                <Typography variant="body2" sx={{ color: "#475569", py: 0.3 }}>✓ Inventory & sales management</Typography>
                <Typography variant="body2" sx={{ color: "#475569", py: 0.3 }}>✓ Reports & team management</Typography>
              </Box>
            </Box>

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleSubscribe}
              disabled={subLoading}
              sx={{
                py: 1.4,
                fontWeight: 700,
                fontSize: "0.95rem",
                borderRadius: 2,
                background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
                boxShadow: "0 8px 24px rgba(14,165,233,0.3)",
                "&:hover": { background: "linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)" }
              }}
            >
              {subLoading ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : "Subscribe Now"}
            </Button>

            <Button
              variant="text"
              fullWidth
              onClick={logout}
              sx={{ mt: 1.5, color: "#94a3b8", fontWeight: 600 }}
            >
              Logout
            </Button>
          </Paper>
        </Box>
      )}
    </Box>
  );
}

