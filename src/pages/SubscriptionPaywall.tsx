import { Box, Button, Paper, Typography, CircularProgress, Alert, Chip, Stack } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PaymentIcon from "@mui/icons-material/Payment";
import CreditCardIcon from "@mui/icons-material/CreditCard";
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
  const [error, setError] = useState<string | null>(null);
  const [txnResult, setTxnResult] = useState<any>(null);

  const handleQuickPay = async () => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post("/subscriptions/payfast/checkout-session");
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
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.response?.data?.message || "Payment failed. Please try again.";
      setError(msg);
      notify(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const accentGradient = "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)";

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
        p: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 560,
          width: "100%",
          p: { xs: 3, md: 5 },
          borderRadius: 3,
          textAlign: "center",
          boxShadow: isDark ? "0 24px 64px rgba(0,0,0,0.4)" : "0 24px 64px rgba(0,0,0,0.1)",
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: txnResult ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : accentGradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2.5,
            boxShadow: txnResult
              ? "0 8px 24px rgba(16,185,129,0.3)"
              : "0 8px 24px rgba(14,165,233,0.3)",
          }}
        >
          {txnResult ? (
            <CheckCircleOutlineIcon sx={{ color: "#fff", fontSize: 32 }} />
          ) : (
            <PaymentIcon sx={{ color: "#fff", fontSize: 32 }} />
          )}
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 800, color: "text.primary", mb: 0.5 }}>
          {txnResult ? "Payment Successful!" : "Subscribe to Invonta"}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
          {txnResult
            ? "Your subscription is now active. Redirecting to dashboard..."
            : `${business?.name || "Your business"} needs an active subscription to access the dashboard.`}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2, textAlign: "left", borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {!txnResult && (
          <Box>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 2,
                border: "2px solid",
                borderColor: "divider",
                background: isDark ? "rgba(255,255,255,0.03)" : "rgba(14,165,233,0.04)",
                mb: 3,
                textAlign: "left",
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Chip
                    label="Monthly Plan"
                    size="small"
                    sx={{ bgcolor: "rgba(99,102,241,0.1)", color: "#6366f1", fontWeight: 700, letterSpacing: 0.5 }}
                  />
                  <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mt: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary" }}>
                      Rs 5,000
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      /month
                    </Typography>
                  </Box>
                </Box>
                <CreditCardIcon sx={{ fontSize: 40, color: "text.disabled" }} />
              </Stack>
            </Paper>

            <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
              <Chip label="Visa" size="small" />
              <Chip label="Mastercard" size="small" />
              <Chip label="Debit Card" size="small" />
            </Stack>

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleQuickPay}
              disabled={loading}
              sx={{
                mt: 1,
                py: 1.5,
                fontWeight: 700,
                fontSize: "0.95rem",
                borderRadius: 2,
                background: accentGradient,
                boxShadow: "0 8px 24px rgba(14,165,233,0.3)",
                "&:hover": {
                  background: "linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)",
                },
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Pay with Card"}
            </Button>
          </Box>
        )}

        {!txnResult && (
          <Button
            variant="text"
            fullWidth
            onClick={logout}
            sx={{ mt: 2, color: "text.secondary", fontWeight: 600 }}
          >
            Logout
          </Button>
        )}

        <Typography variant="caption" sx={{ color: "text.disabled", display: "block", mt: 2, opacity: 0.65 }}>
          Secured by PayFast • ASASA Tech
        </Typography>
      </Paper>
    </Box>
  );
}
