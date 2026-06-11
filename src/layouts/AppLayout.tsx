import React, { useState, useEffect } from "react";
import { AppBar, Toolbar, Typography, Box, Drawer, List, ListItemButton, ListItemText, IconButton, Divider, Avatar, Stack, Menu, MenuItem, ListItemIcon, ListSubheader, Collapse, Paper, Button, CircularProgress, Tooltip, Alert } from "@mui/material";
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
import RoomRoundedIcon from '@mui/icons-material/RoomRounded';
import StoreRoundedIcon from '@mui/icons-material/StoreRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import ReceiptRoundedIcon from '@mui/icons-material/ReceiptRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import MonetizationOnRoundedIcon from '@mui/icons-material/MonetizationOnRounded';
import KeyboardReturnRoundedIcon from '@mui/icons-material/KeyboardReturnRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import HandshakeRoundedIcon from '@mui/icons-material/HandshakeRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import SwitchAccountIcon from '@mui/icons-material/SwitchAccount';
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';
import SettingsSuggestRoundedIcon from '@mui/icons-material/SettingsSuggestRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ForwardToInboxIcon from '@mui/icons-material/ForwardToInbox';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';

import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import AssistantPanel from "../components/Assistant/AssistantPanel";
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from "../hooks/useAuth";
import { api } from "../api/client";
import { useToast } from "../hooks/useToast";
import { useThemeMode } from "../contexts/ThemeContext";
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import { useNotifications } from "../hooks/useNotifications";
import Badge from '@mui/material/Badge';
import NotificationsPausedIcon from '@mui/icons-material/NotificationsPaused';
import { auth, db, collection, query, where, onSnapshot, orderBy, limit, doc, getDoc, setDoc, updateDoc, addDoc, serverTimestamp, getMessaging, getToken } from "../utils/firebase";

type NavItem = { label: string; to: string; icon: React.ReactNode };
type NavGroup = { id: string; label: string; items: NavItem[] };

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [assistantOpen, setAssistantOpen] = React.useState(false);
  const [voiceMode, setVoiceMode] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false); // Collapsed Sidebar State
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user, business } = useAuth();
  const { notify } = useToast();
  const { mode, toggleTheme } = useThemeMode();
  const [subLoading, setSubLoading] = React.useState(false);
  const [subscriptionMeta, setSubscriptionMeta] = React.useState<{ status: string; active: boolean; currentPeriodEnd?: string | null } | null>(null);
  const [paidThisMonth, setPaidThisMonth] = React.useState(false);
  const [dndMode, setDndMode] = React.useState(localStorage.getItem("invonta_dnd") === "true");
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const { data: notifications = [] } = useNotifications({ limit: 5 });
  const [chatUnread, setChatUnread] = React.useState(0);
  const unreadCount = Number(notifications?.length || 0);
  const isChatFirstRun = React.useRef(true);
  const isFCMRequesting = React.useRef(false);

  // REAL-TIME PRESENCE & DND SYNC
  React.useEffect(() => {
    if (!business?._id) return;
    
    const updatePresence = async () => {
        await setDoc(doc(db, "presence", business._id), {
            id: business._id,
            name: business.name,
            status: dndMode ? 'offline' : 'online',
            dnd: dndMode,
            lastSeen: serverTimestamp()
        }, { merge: true });
    };

    updatePresence();
    const interval = setInterval(updatePresence, 60_000);
    return () => clearInterval(interval);
  }, [business?._id, dndMode]);

  // Real-time listener for chat unread messages (managed subscriptions — no leak)
  React.useEffect(() => {
    if (!user?._id || !business?._id) return;

    const messageUnsubs = new Map<string, () => void>();
    const unreadByChat = new Map<string, number>();
    const seenMessageIds = new Set<string>();

    const syncUnreadTotal = () => {
      const total = Array.from(unreadByChat.values()).reduce((sum, n) => sum + n, 0);
      setChatUnread(total);
    };

    const chatsRef = collection(db, "chats");
    const q = query(chatsRef, where("members", "array-contains", business._id));

    const unsubChat = onSnapshot(q, (snapshot: any) => {
        const skipToasts = isChatFirstRun.current;
        if (isChatFirstRun.current) {
            isChatFirstRun.current = false;
        }

        const activeChatIds = new Set<string>();

        snapshot.docs.forEach((chatDoc: any) => {
            const chatId = chatDoc.id;
            const chatData = chatDoc.data();
            activeChatIds.add(chatId);

            if (messageUnsubs.has(chatId)) return;

            const messagesRef = collection(db, "chats", chatId, "messages");
            const mq = query(messagesRef, where("status", "!=", "read"), limit(50));

            const unsubMsg = onSnapshot(mq, (mSnap: any) => {
                const unreadMsgs = mSnap.docs.filter(
                  (d: any) => d.data().senderId !== business._id
                );
                unreadByChat.set(chatId, unreadMsgs.length);
                syncUnreadTotal();

                if (!skipToasts && unreadMsgs.length > 0 && !dndMode) {
                   const latest = unreadMsgs[unreadMsgs.length - 1]?.data();
                   if (!latest) return;
                   const msgKey = `${chatId}:${latest.id || latest.text}`;
                   if (seenMessageIds.has(msgKey)) return;
                   const msgTime = latest.createdAt?.toMillis
                     ? latest.createdAt.toMillis()
                     : (latest.createdAt instanceof Date ? latest.createdAt.getTime() : Date.now());
                   if (Date.now() - msgTime < 4000) {
                       seenMessageIds.add(msgKey);
                       toast(`New message from ${chatData.groupName || chatData.senderName || 'Chat'}: ${latest.text.substring(0, 30)}${latest.text.length > 30 ? '...' : ''}`, { 
                          icon: '💬',
                          duration: 4000
                       });
                   }
                }
            });
            messageUnsubs.set(chatId, unsubMsg);
        });

        for (const [chatId, unsub] of messageUnsubs) {
          if (!activeChatIds.has(chatId)) {
            unsub();
            messageUnsubs.delete(chatId);
            unreadByChat.delete(chatId);
          }
        }
        syncUnreadTotal();
    });

    // General Notifications (Friend Requests, Orders, etc)
    const notifRef = collection(db, "notifications");
    const nq = query(notifRef, where("targetId", "==", business._id), where("read", "==", false));
    
    const unsubNotif = onSnapshot(nq, (nSnap: any) => {
        nSnap.docs.forEach((d: any) => {
            const data = d.data();
            if (data.createdAt && (Date.now() - data.createdAt.toMillis() < 5000)) {
                toast(data.message, { icon: '🔔', duration: 4000 });
            }
        });
    });

    return () => {
        unsubChat();
        unsubNotif();
        messageUnsubs.forEach((unsub) => unsub());
        messageUnsubs.clear();
    };
  }, [user?._id, business?._id, dndMode]);

  // Handle FCM Registration + Permission
  useEffect(() => {
      if (!business?._id || isFCMRequesting.current) return;
      isFCMRequesting.current = true;

      const setupFCM = async () => {
          try {
              // Ask for permission explicitly
              if (typeof window !== "undefined" && "Notification" in window) {
                  console.log("Requesting notification permission...");
                  const permission = await Notification.requestPermission();
                  if (permission !== "granted") {
                      console.warn("Notification permission denied");
                  }
              }

              const token = await getToken();
              if (token) {
                  try {
                      await setDoc(doc(db, "users", business._id), {
                          fcmToken: token,
                          updatedAt: serverTimestamp()
                      }, { merge: true });
                  } catch (e) {
                      console.warn("Failed to save FCM token (user doc potentially missing):", e);
                  }
              }
          } catch (err) {
              console.error("FCM Registration Failed:", err);
          }
      };

      setupFCM();
      return () => {
        isFCMRequesting.current = false;
      };
  }, [business?._id]);

  // ── Real-time block detection via Firebase ────────────────────────────────
  // Works for ADMIN (business._id) and STAFF (user.businessId)
  const blockWatchId = business?._id || user?.businessId;
  useEffect(() => {
    if (!blockWatchId || user?.role === "SUPER_ADMIN") return;
    const unsub = onSnapshot(
      doc(db, "business_blocks", blockWatchId),
      (snap) => {
        if (snap.exists()) {
          logout();
          navigate("/login");
        }
      },
      (err) => { console.warn("Block listener error:", err.message); }
    );
    return () => unsub();
  }, [blockWatchId]);

  const handleLogout = async () => {
      try {
          if (business?._id) {
              try {
                  await setDoc(doc(db, "users", business._id), {
                      fcmToken: null,
                      logoutAt: serverTimestamp()
                  }, { merge: true });
              } catch (e) {
                  console.warn("FCM clear failed or user doc missing:", e);
              }
              
              try {
                  await setDoc(doc(db, "presence", business._id), {
                      status: 'offline',
                      lastSeen: serverTimestamp(),
                      updatedAt: serverTimestamp()
                  }, { merge: true });
              } catch (e) {
                  console.warn("Presence clear failed:", e);
              }
          }
          logout();
          toast.success("Successfully logged out");
          navigate("/login");
      } catch (error) {
          console.error("Logout failed:", error);
          toast.error("Failed to logout safely");
          logout();
          navigate("/login");
      }
  };

  const drawerWidth = collapsed ? 84 : 260;

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  React.useEffect(() => {
    if (isSuperAdmin) return;
    const lastCheck = Number(sessionStorage.getItem("invonta:sub-check") || 0);
    if (Date.now() - lastCheck < 5 * 60_000 && subscriptionMeta) return;

    let canceled = false;

    const checkSubscription = async () => {
      try {
        const [statusRes, txRes] = await Promise.all([
          api.get("/subscriptions/status", { skipLoader: true } as any),
          api.get("/subscriptions/transactions", { params: { page: 1, limit: 50 }, skipLoader: true } as any),
        ]);

        if (canceled) return;
        const statusData = statusRes?.data?.data || statusRes?.data || {};
        const normalizedStatus = String(statusData?.status || business?.subscriptionStatus || "pending").toLowerCase();
        setSubscriptionMeta({
          status: normalizedStatus,
          active: Boolean(statusData?.active),
          currentPeriodEnd: statusData?.currentPeriodEnd || null,
        });

        const txItems = txRes?.data?.data?.items || txRes?.data?.items || [];
        const now = new Date();
        const hasPaidThisMonth = txItems.some((tx: any) => {
          if (String(tx?.status || "").toLowerCase() !== "paid" || !tx?.paidAt) return false;
          const paidDate = new Date(tx.paidAt);
          return paidDate.getFullYear() === now.getFullYear() && paidDate.getMonth() === now.getMonth();
        });
        setPaidThisMonth(hasPaidThisMonth);
        sessionStorage.setItem("invonta:sub-check", String(Date.now()));
      } catch {
        if (canceled) return;
        const fallbackStatus = String(business?.subscriptionStatus || "pending").toLowerCase();
        setSubscriptionMeta({
          status: fallbackStatus,
          active: fallbackStatus === "active",
          currentPeriodEnd: null,
        });
        setPaidThisMonth(false);
      }
    };

    checkSubscription();
    return () => {
      canceled = true;
    };
  }, [isSuperAdmin, business?.subscriptionStatus]);

  const effectiveSubStatus = String(subscriptionMeta?.status || business?.subscriptionStatus || "pending").toLowerCase();
  const businessSubStatus = String(business?.subscriptionStatus || "pending").toLowerCase();
  const isSubscriptionActive =
    effectiveSubStatus === "active" &&
    businessSubStatus === "active" &&
    (subscriptionMeta?.active ?? true);
  const dayOfMonth = new Date().getDate();
  const showMonthlyWarning = !isSuperAdmin && isSubscriptionActive && !paidThisMonth && dayOfMonth >= 1 && dayOfMonth <= 4;
  const monthlyBlocked = !isSuperAdmin && isSubscriptionActive && !paidThisMonth && dayOfMonth > 4;

  const showSubscriptionNav = !isSuperAdmin && (!isSubscriptionActive || showMonthlyWarning || monthlyBlocked);
  const showPaywall = false;
  
  const handleSubscribe = () => {
    setSubLoading(true);
    api
      .post("/subscriptions/payfast/checkout-session")
      .then(({ data }) => {
        const session = data?.data || data;
        const actionUrl = session?.actionUrl;
        const fields = session?.fields || {};
        if (!actionUrl || !fields || typeof fields !== "object") {
          throw new Error("Invalid checkout session response");
        }

        const form = document.createElement("form");
        form.method = "POST";
        form.action = actionUrl;
        form.target = "_self";

        Object.entries(fields).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = String(value ?? "");
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      })
      .catch((err: any) => {
        const msg =
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          "Failed to start checkout";
        notify(msg, "error");
      })
      .finally(() => setSubLoading(false));
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const rawDisplayName = user?.name || user?.fullName || user?.email || "Account";
  const displayName = Array.from(new Set(String(rawDisplayName).split(" ").filter(Boolean).map(s => s.trim())))
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase())
    .join(" ");

  const initials = Array.from(new Set(String(displayName).split(" ").filter(Boolean)))
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
    borrows: ["borrows"],
    employees: ["hr"],
    attendance: ["hr"],
    leaves: ["hr"],
    payroll: ["hr"],
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
            { label: "Monthly Billing", to: "/superadmin/monthly-billing", icon: <CalendarMonthRoundedIcon /> },
            { label: "Invitations", to: "/superadmin/invitations", icon: <ForwardToInboxIcon /> },
            { label: "Transactions", to: "/superadmin/transactions", icon: <ReceiptRoundedIcon /> },
            { label: "Subscriptions", to: "/superadmin/subscription-status", icon: <CreditCardIcon /> }
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
            ...(isAllowed("inventory") && isAllowed("warehouses")
              ? [{ label: "Locations", to: "/locations", icon: <RoomRoundedIcon /> }]
              : []),
            ...(isAllowed("purchasing") ? [{ label: "Purchasing", to: "/purchasing", icon: <ShoppingCartRoundedIcon /> }] : []),
            ...(isAllowed("sales") ? [{ label: "Sales", to: "/sales", icon: <MonetizationOnRoundedIcon /> }] : []),
            ...(isAllowed("sales") ? [{ label: "Sales Returns", to: "/sales/returns", icon: <KeyboardReturnRoundedIcon /> }] : []),
            ...(isAllowed("borrows") ? [{ label: "Stock Loans", to: "/borrows", icon: <SwitchAccountIcon /> }] : []),
          ]
        },
        {
          id: "people",
          label: "People",
          items: [
            ...(isAllowed("employees") ? [{ label: "Employees", to: "/employees", icon: <PeopleRoundedIcon /> }] : []),
            ...(isAllowed("attendance") ? [{ label: "Attendance", to: "/attendance", icon: <AccessTimeRoundedIcon /> }] : []),
            ...(isAllowed("leaves") ? [{ label: "Leaves", to: "/leaves", icon: <EventAvailableRoundedIcon /> }] : []),
            ...(isAllowed("payroll") ? [{ label: "Payroll", to: "/payroll", icon: <PaymentsRoundedIcon /> }] : [])
          ]
        },
        {
          id: "partners",
          label: "Ecosystem",
          items: [
            ...(isAllowed("customers") || isAllowed("vendors") ? [{ label: "Partners", to: "/partners", icon: <HandshakeRoundedIcon /> }] : []),
            { label: "Network", to: "/network", icon: <GroupsRoundedIcon /> },
            { label: "Chat", to: "/chat", icon: <ChatBubbleRoundedIcon /> }
          ]
        },
        {
          id: "analytics",
          label: "Analytics",
          items: [
            ...(isAllowed("reports") ? [{ label: "Reports", to: "/reports", icon: <AssessmentRoundedIcon /> }] : []),
            ...(isAllowed("borrows") ? [{ label: "Loan Profit", to: "/borrows/profit-report", icon: <MonetizationOnRoundedIcon /> }] : []),
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
    if (collapsed) return;
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

  const contentBg = mode === "dark" ? "#020617" : "#eff6ff";
  const activeBg  = mode === "dark" ? "#020617" : "#eff6ff";
  const activeColor = mode === "dark" ? "#38bdf8" : "#0f172a";

  const getActiveItemSx = (active: boolean) => {
    if (!active) {
      return {
        borderRadius: 2,
        color: "rgba(226,232,240,0.55)",
        "&:hover": {
          borderRadius: 2,
          color: "#ffffff",
          background: "rgba(255,255,255,0.07)",
        }
      };
    }

    return {
      background: activeBg,
      color: activeColor,
      borderTopLeftRadius: 20,
      borderBottomLeftRadius: 20,
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
      mr: "-16px",
      // left accent bar
      boxShadow: `inset 3px 0 0 #0ea5e9`,
      "&:hover": {
        background: activeBg,
      },
      // top corner cutout
      "&::before": {
        content: '""',
        position: "absolute",
        right: -4,
        top: -20,
        width: 20,
        height: 20,
        background: "transparent",
        borderBottomRightRadius: 20,
        boxShadow: `15px 15px 0px 15px ${contentBg}`,
        pointerEvents: "none",
      },
      // bottom corner cutout
      "&::after": {
        content: '""',
        position: "absolute",
        right: -4,
        bottom: -20,
        width: 20,
        height: 20,
        background: "transparent",
        borderTopRightRadius: 20,
        boxShadow: `15px -15px 0px 15px ${contentBg}`,
        pointerEvents: "none",
      },
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
                        <Badge 
                            badgeContent={item.label === "Chat" ? chatUnread : 0} 
                            color="error"
                            variant="dot"
                            invisible={item.label !== "Chat" || chatUnread === 0}
                            sx={{ '& .MuiBadge-badge': { right: 4, top: 4 } }}
                        >
                            {React.cloneElement(item.icon as React.ReactElement, { fontSize: active ? "medium" : "small" })}
                        </Badge>
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
        <Toolbar
          sx={{
            minHeight: { xs: 60, sm: 64, md: 74 },
            px: { xs: 1.25, sm: 2, md: 4 },
            gap: { xs: 0.5, sm: 1 },
          }}
        >
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: { xs: 0.5, sm: 1, md: 2 }, display: { md: "none" } }}>
            <MenuIcon />
          </IconButton>

          <IconButton onClick={() => setCollapsed(!collapsed)} sx={{ mr: 3, display: { xs: "none", md: "inline-flex" }, color: "#64748b" }}>
            {collapsed ? <FormatIndentIncreaseIcon /> : <FormatIndentDecreaseIcon />}
          </IconButton>

          <Box sx={{ flexGrow: 1, minWidth: 0 }} />

          <Stack
            direction="row"
            spacing={{ xs: 0.25, sm: 1, md: 2 }}
            alignItems="center"
            sx={{ flexShrink: 0 }}
          >
            <IconButton component={Link} to="/notifications" sx={{ color: "#64748b" }}>
               <Badge badgeContent={unreadCount} color="error" overlap="circular">
                 <NotificationsRoundedIcon />
               </Badge>
            </IconButton>

            {/* Hide secondary actions on phones — they live inside the avatar menu instead. */}
            <IconButton component={Link} to="/referrals" sx={{ color: "#64748b", display: { xs: "none", sm: "inline-flex" } }}>
               <FavoriteRoundedIcon />
            </IconButton>

            <Divider orientation="vertical" flexItem sx={{ my: 2, display: { xs: "none", sm: "block" } }} />

            <Box
              onClick={handleMenu}
              sx={{
                p: 0.5,
                pl: { xs: 0.5, sm: 1.5 },
                pr: { xs: 0.5, sm: 1 },
                borderRadius: 24,
                backgroundColor: "rgba(15,23,42,0.02)",
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                maxWidth: { xs: 56, sm: 240 },
              }}
            >
              <Box
                sx={{
                  textAlign: "right",
                  display: { xs: "none", sm: "block" },
                  mr: 1.5,
                  minWidth: 0,
                  overflow: "hidden",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
                  {displayName}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
                  {isSuperAdmin ? "Super Admin" : (business?.name === displayName ? "Business Account" : (business?.name || "Member"))}
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
              <IconButton onClick={toggleTheme} sx={{ color: "#64748b", display: { xs: "none", sm: "inline-flex" } }}>
                 {mode === 'light' ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />}
              </IconButton>
            </Tooltip>

            {!isSuperAdmin && (
              <Tooltip title="Account Settings">
                <IconButton component={Link} to="/settings/profile" sx={{ color: "#64748b", display: { xs: "none", sm: "inline-flex" } }}>
                  <SettingsSuggestRoundedIcon />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Logout">
              <IconButton
                onClick={handleLogout}
                sx={{
                  color: "#e11d48",
                  bgcolor: "rgba(225,29,72,0.05)",
                  display: { xs: "none", sm: "inline-flex" },
                  "&:hover": { bgcolor: "rgba(225,29,72,0.12)" },
                }}
              >
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: { minWidth: 220, mt: 1, borderRadius: 2 },
        }}
      >
        <Box sx={{ px: 2, py: 1.2 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayName}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
            {isSuperAdmin ? "Super Admin" : (business?.name || "Member")}
          </Typography>
        </Box>
        <Divider />
        <MenuItem component={Link} to="/notifications" onClick={handleClose}>
          <ListItemIcon><NotificationsRoundedIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}</ListItemText>
        </MenuItem>
        <MenuItem component={Link} to="/referrals" onClick={handleClose}>
          <ListItemIcon><FavoriteRoundedIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Referrals</ListItemText>
        </MenuItem>
        {!isSuperAdmin && (
          <MenuItem component={Link} to="/settings/profile" onClick={handleClose}>
            <ListItemIcon><SettingsSuggestRoundedIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Account Settings</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => { toggleTheme(); handleClose(); }}>
          <ListItemIcon>
            {mode === "light" ? <DarkModeRoundedIcon fontSize="small" /> : <LightModeRoundedIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>{mode === "light" ? "Dark mode" : "Light mode"}</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { handleClose(); handleLogout(); }} sx={{ color: "#e11d48" }}>
          <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: "#e11d48" }} /></ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>

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
              borderRight: "0 !important",
              boxShadow: "none !important",
              transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              overflow: "visible" 
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
          px: { xs: 1.5, sm: 3, md: 4 },
          py: { xs: 2, sm: 3, md: 4 },
          mt: { xs: "60px", sm: "64px", md: "74px" },
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

      {/* Floating Assistant Button */}
      {!isSuperAdmin && !assistantOpen && (
        <Tooltip title={voiceMode ? "Voice mode active — click to open" : "Invonta Assistant"} placement="left">
          <Box
            onClick={() => setAssistantOpen(true)}
            sx={{
              position: "fixed",
              bottom: { xs: 18, sm: 28 },
              right: { xs: 16, sm: 28 },
              zIndex: 1300,
              width: { xs: 52, sm: 56 },
              height: { xs: 52, sm: 56 },
              borderRadius: "50%",
              background: voiceMode
                ? "linear-gradient(135deg, #e11d48 0%, #6366f1 100%)"
                : "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
              boxShadow: voiceMode
                ? "0 0 0 0 rgba(225,29,72,0.7)"
                : "0 4px 20px rgba(99,102,241,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              animation: voiceMode ? "voiceGlow 1.6s ease-in-out infinite" : "none",
              "@keyframes voiceGlow": {
                "0%": { boxShadow: "0 0 0 0 rgba(225,29,72,0.7)" },
                "70%": { boxShadow: "0 0 0 16px rgba(225,29,72,0)" },
                "100%": { boxShadow: "0 0 0 0 rgba(225,29,72,0)" },
              },
              transition: "background 0.3s ease",
              "&:hover": { transform: "scale(1.08)" },
              "&:active": { transform: "scale(0.95)" },
            }}
          >
            <SmartToyRoundedIcon sx={{ color: "#fff", fontSize: 28 }} />
          </Box>
        </Tooltip>
      )}

      {(assistantOpen || voiceMode) && (
        <AssistantPanel
          open={assistantOpen}
          onClose={() => setAssistantOpen(false)}
          voiceMode={voiceMode}
          setVoiceMode={setVoiceMode}
        />
      )}

      <Toaster position="top-right" reverseOrder={false} />
    </Box>
  );
}
