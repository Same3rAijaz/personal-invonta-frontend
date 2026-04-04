import React from "react";
import { AppBar, Toolbar, Typography, Box, Drawer, List, ListItemButton, ListItemText, IconButton, Divider, Avatar, Stack, Menu, MenuItem, ListItemIcon, ListSubheader, Collapse, Paper, Button, CircularProgress, Tooltip } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import FormatIndentDecreaseIcon from '@mui/icons-material/FormatIndentDecrease';
import FormatIndentIncreaseIcon from '@mui/icons-material/FormatIndentIncrease';

import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import ShoppingBagRoundedIcon from '@mui/icons-material/ShoppingBagRounded';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import WarehouseRoundedIcon from '@mui/icons-material/WarehouseRounded';
import StoreRoundedIcon from '@mui/icons-material/StoreRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import ReceiptRoundedIcon from '@mui/icons-material/ReceiptRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import MonetizationOnRoundedIcon from '@mui/icons-material/MonetizationOnRounded';
import KeyboardReturnRoundedIcon from '@mui/icons-material/KeyboardReturnRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import HandshakeRoundedIcon from '@mui/icons-material/HandshakeRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import SwitchAccountIcon from '@mui/icons-material/SwitchAccount';
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';
import SettingsSuggestRoundedIcon from '@mui/icons-material/SettingsSuggestRounded';

import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { api } from "../api/client";
import { useToast } from "../hooks/useToast";
import { useThemeMode } from "../contexts/ThemeContext";
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';

type NavItem = { label: string; to: string; icon: React.ReactNode };
type NavGroup = { id: string; label: string; items: NavItem[] };

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false); // Collapsed Sidebar State
  const location = useLocation();
  const { logout, user, business } = useAuth();
  const { notify } = useToast();
  const { mode, toggleTheme } = useThemeMode();
  const [subLoading, setSubLoading] = React.useState(false);

  const drawerWidth = collapsed ? 84 : 260; // wider expanded, mini collapsed

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

  const directNavItems: NavItem[] = [{ label: "Dashboard", to: "/", icon: <DashboardRoundedIcon /> }];
  const navGroups: NavGroup[] = isSuperAdmin
    ? [
        {
          id: "platform",
          label: "Platform",
          items: [
            { label: "Markets", to: "/superadmin/markets", icon: <StoreRoundedIcon /> },
            { label: "Businesses", to: "/superadmin/businesses", icon: <BusinessRoundedIcon /> },
            { label: "Categories", to: "/superadmin/categories", icon: <CategoryRoundedIcon /> },
            { label: "Approval Requests", to: "/superadmin/requests", icon: <AssignmentRoundedIcon /> },
            { label: "Transactions", to: "/superadmin/transactions", icon: <ReceiptRoundedIcon /> }
          ]
        },
        {
          id: "referrals",
          label: "Referrals",
          items: [{ label: "Referral Settings", to: "/referrals/settings", icon: <FavoriteRoundedIcon /> }]
        }
      ]
    : [
        {
          id: "operations",
          label: "Operations",
          items: [
            ...(isAllowed("products") ? [{ label: "Products", to: "/products", icon: <ShoppingBagRoundedIcon /> }] : []),
            ...(isAllowed("inventory") ? [{ label: "Inventory", to: "/inventory", icon: <InventoryRoundedIcon /> }] : []),
            ...(isAllowed("warehouses") ? [{ label: "Warehouses", to: "/warehouses", icon: <WarehouseRoundedIcon /> }] : []),
            ...(isAllowed("purchasing") ? [{ label: "Purchasing", to: "/purchasing", icon: <ShoppingCartRoundedIcon /> }] : []),
            ...(isAllowed("sales") ? [{ label: "Sales", to: "/sales", icon: <MonetizationOnRoundedIcon /> }] : []),
            ...(isAllowed("sales") ? [{ label: "Sales Returns", to: "/sales/returns", icon: <KeyboardReturnRoundedIcon /> }] : []),
            ...(isAllowed("sales") ? [{ label: "Stock Loans", to: "/borrows", icon: <SwitchAccountIcon /> }] : [])
          ]
        },
        {
          id: "people",
          label: "People",
          items: [
            ...(isAllowed("employees") ? [{ label: "Employees", to: "/employees", icon: <PeopleRoundedIcon /> }] : [])
          ]
        },
        {
          id: "partners",
          label: "Ecosystem",
          items: [
            // Replaced explicit customer/vendor links with merged Partners view
            ...(isAllowed("customers") || isAllowed("vendors") ? [{ label: "Partners", to: "/partners", icon: <HandshakeRoundedIcon /> }] : []),
            // Replaced explicit shop-friends/shop-discover with merged Network view
            { label: "Network", to: "/network", icon: <GroupsRoundedIcon /> },
            // Added Chat
            { label: "Chat", to: "/chat", icon: <ChatBubbleRoundedIcon /> }
          ]
        },
        {
          id: "analytics",
          label: "Analytics",
          items: [
            ...(isAllowed("reports") ? [{ label: "Reports", to: "/reports", icon: <AssessmentRoundedIcon /> }] : []),
            ...(isAllowed("sales") ? [{ label: "Loan Profit", to: "/borrows/profit-report", icon: <MonetizationOnRoundedIcon /> }] : []),
            ...(isAllowed("udhaar") ? [{ label: "Udhaar", to: "/udhaar/parties", icon: <AccountBalanceWalletRoundedIcon /> }] : [])
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
    const moreSpecificMatch = allNavPaths.some(
      (p) => p !== path && p.startsWith(path + "/") &&
        (location.pathname === p || location.pathname.startsWith(p + "/"))
    );
    return !moreSpecificMatch;
  };
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({});
  React.useEffect(() => {
    if (collapsed) return; // don't calc groups if collapsed
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
  }, [filteredNavGroups, location.pathname, collapsed]);

  const getActiveItemSx = (active: boolean) => {
    if (!active) {
      return {
        color: "rgba(226,232,240,0.6)",
        "&:hover": {
          color: "#ffffff",
          background: "transparent"
        }
      };
    }
    
    return {
      background: mode === "dark" ? "#020617" : "#eff6ff",
      color: mode === "dark" ? "#38bdf8" : "#0f172a",
      borderTopLeftRadius: 24,
      borderBottomLeftRadius: 24,
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
      mr: "-16px", // Bleed entirely to the right edge!
      "&:hover": {
        background: mode === "dark" ? "#020617" : "#eff6ff"
      },
      "&::before": {
         content: '""',
         position: "absolute",
         right: 0,
         top: -20,
         width: 20,
         height: 20,
         background: "transparent",
         borderBottomRightRadius: 20,
         boxShadow: `10px 10px 0 10px ${mode === "dark" ? "#020617" : "#eff6ff"}`,
         zIndex: 1
      },
      "&::after": {
         content: '""',
         position: "absolute",
         right: 0,
         bottom: -20,
         width: 20,
         height: 20,
         background: "transparent",
         borderTopRightRadius: 20,
         boxShadow: `10px -10px 0 10px ${mode === "dark" ? "#020617" : "#eff6ff"}`,
         zIndex: 1
      }
    };
  };

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflowX: "hidden" }}>
      <Box sx={{ px: collapsed ? 2.5 : 3.5, py: 3, display: "flex", alignItems: "center", gap: 2, height: 74 }}>
        <Box component="img" src="/Invonta.png" alt="Invonta" sx={{ width: 34, height: 34, flexShrink: 0 }} />
        {!collapsed && (
          <Box sx={{ whiteSpace: "nowrap" }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#ffffff", lineHeight: 1.1, letterSpacing: -0.5 }}>Invonta</Typography>
            <Typography variant="caption" sx={{ color: "rgba(226,232,240,0.6)", letterSpacing: 1.2, fontWeight: 600 }}>OPERATIONS</Typography>
          </Box>
        )}
      </Box>

      <List
        sx={{ px: collapsed ? 1.5 : 2.5, py: 2, flexGrow: 1, overflowY: "auto", overflowX: "hidden" }}
      >
        {directNavItems.map((item) => {
          const active = isActive(item.to);
          return (
            <Tooltip title={collapsed ? item.label : ""} placement="right" key={item.to} arrow>
              <ListItemButton
                component={Link}
                to={item.to}
                disableRipple
                sx={{
                  mb: 1,
                  px: collapsed ? 1.5 : 2,
                  py: 1.2,
                  justifyContent: collapsed ? "center" : "flex-start",
                  position: "relative",
                  transition: "color 0.2s ease",
                  ...getActiveItemSx(active)
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 2, color: "inherit", zIndex: 2 }}>
                  {React.cloneElement(item.icon as React.ReactElement, { fontSize: "small" })}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText 
                    primary={item.label} 
                    primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: active ? 800 : 600, letterSpacing: -0.2 }} 
                    sx={{ m: 0, zIndex: 2 }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          );
        })}
        
        {filteredNavGroups.map((group) => {
          return (
            <React.Fragment key={group.id}>
              {!collapsed && (
                <ListSubheader
                  disableSticky
                  sx={{
                    bgcolor: "transparent",
                    color: "rgba(148,163,184,0.5)",
                    textTransform: "uppercase",
                    letterSpacing: 1.2,
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    px: 1,
                    py: 1.5,
                    lineHeight: 1
                  }}
                >
                  {group.label}
                </ListSubheader>
              )}
              {collapsed && <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 2, mx: 1 }} />}
              
              {group.items.map((item) => {
                const active = isActive(item.to);
                return (
                  <Tooltip title={collapsed ? item.label : ""} placement="right" key={item.to} arrow disableHoverListener={!collapsed}>
                    <ListItemButton
                      component={Link}
                      to={item.to}
                      disableRipple
                      sx={{
                        mb: 0.6,
                        px: collapsed ? 1.5 : 2,
                        py: 1.1,
                        justifyContent: collapsed ? "center" : "flex-start",
                        position: "relative",
                        transition: "color 0.2s ease",
                        ...getActiveItemSx(active)
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 2, color: "inherit", zIndex: 2 }}>
                        {React.cloneElement(item.icon as React.ReactElement, { fontSize: active ? "medium" : "small" })}
                      </ListItemIcon>
                      {!collapsed && (
                        <ListItemText 
                          primary={item.label} 
                          primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: active ? 700 : 500 }} 
                          sx={{ m: 0, zIndex: 2 }}
                        />
                      )}
                    </ListItemButton>
                  </Tooltip>
                );
              })}
            </React.Fragment>
          );
        })}
      </List>
      
      {/* Settings / Referrals shortcut at bottom for Desktop expanded if needed, but per request, logout/settings moved to top navbar. So we don't need a bulky bottom section. */}
      {/* We leave the bottom blank to respect the user's desire to move "account settings to top navibar" */}
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: 1201,
          width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
          ml: { xs: 0, md: `${drawerWidth}px` },
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), margin 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          background: mode === "dark" ? "rgba(15,23,42,0.85)" : "rgba(255,255,255,0.85)",
          backdropFilter: "blur(18px)",
          borderBottom: mode === "dark" ? "1px solid rgba(248,250,252,0.05)" : "1px solid rgba(148,163,184,0.15)",
          color: mode === "dark" ? "#f8fafc" : "#0f172a"
        }}
      >
        <Toolbar sx={{ minHeight: 74, px: { xs: 2, md: 4 } }}>
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2, display: { md: "none" } }}>
            <MenuIcon />
          </IconButton>

          {/* Desktop Toggle Sidebar */}
          <IconButton onClick={() => setCollapsed(!collapsed)} sx={{ mr: 3, display: { xs: "none", md: "inline-flex" }, color: "#64748b" }}>
            {collapsed ? <FormatIndentIncreaseIcon /> : <FormatIndentDecreaseIcon />}
          </IconButton>



          <Box sx={{ flexGrow: 1 }} />

          {/* Right Top Navbar Tools */}
          <Stack direction="row" spacing={2} alignItems="center">
            {/* Notification Icon */}
            <IconButton sx={{ color: "#64748b" }}>
               <NotificationsRoundedIcon />
            </IconButton>

            {/* Quick Referrals (if allowed) */}
            <IconButton component={Link} to="/referrals" sx={{ color: "#64748b" }}>
               <FavoriteRoundedIcon />
            </IconButton>

            <Divider orientation="vertical" flexItem sx={{ my: 2 }} />

            <Box
              sx={{ 
                p: 0.5, pl: { sm: 1.5 }, pr: 1, 
                borderRadius: 24, 
                backgroundColor: "rgba(15,23,42,0.02)", 
                display: "flex",
                alignItems: "center"
              }}
            >
              <Box sx={{ textAlign: "right", display: { xs: "none", sm: "block" }, mr: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>
                  {displayName}
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b", display: "block", mt: 0.2 }}>
                  {isSuperAdmin ? "Super Admin" : (business?.name || "Member")}
                </Typography>
              </Box>
              <Avatar
                sx={{
                  background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
                  color: "#ffffff",
                  width: 36,
                  height: 36,
                  fontSize: 13,
                  fontWeight: 800,
                  boxShadow: "0 2px 8px rgba(14,165,233,0.3)"
                }}
              >
                {initials}
              </Avatar>
            </Box>

            <Tooltip title={`Switch to ${mode === 'light' ? 'Dark' : 'Light'} Mode`}>
              <IconButton onClick={toggleTheme} sx={{ color: "#64748b" }}>
                 {mode === 'light' ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />}
              </IconButton>
            </Tooltip>

            {!isSuperAdmin && (
              <Tooltip title="Account Settings">
                <IconButton component={Link} to="/settings/profile" sx={{ color: "#64748b" }}>
                  <SettingsSuggestRoundedIcon />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Logout">
              <IconButton onClick={logout} sx={{ color: "#e11d48", bgcolor: "rgba(225,29,72,0.05)", "&:hover": { bgcolor: "rgba(225,29,72,0.12)" } }}>
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 }, transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              width: 260,
              background: "#0c1220",
              color: "#e2e8f0",
              borderRight: "none"
            }
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              background: "#0c1220",
              color: "#e2e8f0",
              borderRight: "none",
              transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              overflow: "visible" // Critical to allow the white pseudo-elements to break outside the drawer boundary flawlessly!
            }
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          position: "relative",
          flexGrow: 1,
          minWidth: 0,
          width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 3, sm: 4, md: 4 },
          mt: { xs: "74px" },
          minHeight: "100vh",
          overflowX: "hidden",
          background: mode === "dark" ? "#020617" : "#eff6ff",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          animation: "fadeInUp 420ms ease",
          zIndex: 0
        }}
      >
        <Outlet />
      </Box>

      {/* Paywall code unchanged */}
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
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", mb: 0.5 }}>Subscription Required</Typography>
            <Typography variant="body2" sx={{ color: "#64748b", mb: 3 }}>Activate your plan to unlock all features</Typography>
            <Box sx={{ p: 2.5, borderRadius: 2, border: "2px solid rgba(14,165,233,0.15)", background: "linear-gradient(135deg, rgba(14,165,233,0.04) 0%, rgba(99,102,241,0.04) 100%)", mb: 3 }}>
              <Typography variant="overline" sx={{ color: "#6366f1", fontWeight: 700, letterSpacing: 1.5 }}>Monthly Plan</Typography>
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
            <Button variant="contained" fullWidth size="large" onClick={handleSubscribe} disabled={subLoading} sx={{ py: 1.4, fontWeight: 700, fontSize: "0.95rem", borderRadius: 2, background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)", boxShadow: "0 8px 24px rgba(14,165,233,0.3)", "&:hover": { background: "linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)" } }}>
              {subLoading ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : "Subscribe Now"}
            </Button>
            <Button variant="text" fullWidth onClick={logout} sx={{ mt: 1.5, color: "#94a3b8", fontWeight: 600 }}>Logout</Button>
          </Paper>
        </Box>
      )}
    </Box>
  );
}
