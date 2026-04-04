import { Box, Button, Paper, Typography, CircularProgress } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useAuth } from "../hooks/useAuth";
import { api } from "../api/client";
import { useState } from "react";
import { useToast } from "../hooks/useToast";

import { useThemeMode } from "../contexts/ThemeContext";

export default function SubscriptionPaywall() {
  const { logout, business } = useAuth();
  const { notify } = useToast();
  const { mode } = useThemeMode();
  const isDark = mode === "dark";
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: isDark 
          ? "radial-gradient(circle at top left, rgba(14,165,233,0.15) 0%, #020617 40%, #0f172a 100%)" 
          : "radial-gradient(circle at top left, rgba(14,165,233,0.08) 0%, #f1f5f9 40%, #e2e8f0 100%)",
        transition: "background 0.3s ease",
        p: 3
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 520,
          width: "100%",
          p: { xs: 4, md: 6 },
          borderRadius: 3,
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 3,
            boxShadow: "0 8px 24px rgba(14,165,233,0.3)"
          }}
        >
          <LockOutlinedIcon sx={{ color: "#fff", fontSize: 36 }} />
        </Box>

        <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary", mb: 1 }}>
          Subscription Required
        </Typography>

        <Typography variant="body1" sx={{ color: "text.secondary", mb: 3 }}>
          {business?.name ? `${business.name} needs` : "Your business needs"} an active subscription to access the dashboard.
        </Typography>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            border: "2px solid",
            borderColor: "divider",
            background: isDark ? "rgba(255,255,255,0.03)" : "rgba(14,165,233,0.05)",
            mb: 4
          }}
        >
          <Typography variant="overline" sx={{ color: "#6366f1", fontWeight: 700, letterSpacing: 1.5 }}>
            Monthly Plan
          </Typography>
          <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 0.5, mt: 1 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, color: "text.primary" }}>
              ₨5,000
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              /month
            </Typography>
          </Box>
          <Box sx={{ mt: 2, textAlign: "left" }}>
            <Typography variant="body2" sx={{ color: "text.secondary", py: 0.5 }}>✓ Full dashboard access</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", py: 0.5 }}>✓ Inventory & stock management</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", py: 0.5 }}>✓ Sales & purchasing</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", py: 0.5 }}>✓ Reports & analytics</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", py: 0.5 }}>✓ Team & employee management</Typography>
          </Box>
        </Paper>

        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={handleSubscribe}
          disabled={loading}
          sx={{
            py: 1.6,
            fontWeight: 700,
            fontSize: "1rem",
            borderRadius: 2,
            background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
            boxShadow: "0 8px 24px rgba(14,165,233,0.3)",
            "&:hover": {
              background: "linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)"
            }
          }}
        >
          {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Subscribe Now — ₨5,000/mo"}
        </Button>

        <Button
          variant="text"
          fullWidth
          onClick={logout}
          sx={{ mt: 2, color: "text.secondary", fontWeight: 600 }}
        >
          Logout
        </Button>
      </Paper>
    </Box>
  );
}
