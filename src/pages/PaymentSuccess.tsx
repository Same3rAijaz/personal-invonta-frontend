import { Box, Button, Paper, Typography, CircularProgress } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useAuth } from "../hooks/useAuth";
import { api } from "../api/client";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function PaymentSuccess() {
  const { business, login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const refreshBusinessData = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const basketId = params.get("basketId") || params.get("basket_id") || params.get("BASKET_ID") || undefined;
        const transactionId =
          params.get("transactionId") || params.get("transaction_id") || params.get("TRANSACTION_ID") || undefined;
        const errCode = params.get("err_code") || params.get("ERR_CODE") || undefined;
        const errMsg = params.get("err_msg") || params.get("ERR_MSG") || undefined;

        if (basketId) {
          await api.post("/subscriptions/payfast/finalize-hosted-success", {
            basketId,
            transactionId,
            errCode,
            errMsg,
          });
        }

        // Refresh business data to get updated subscriptionStatus
        const { data } = await api.get("/businesses/me");
        if (data?.data) {
          localStorage.setItem("business", JSON.stringify(data.data));
          window.location.href = "/";
          return;
        }
      } catch (err) {
        setError("Payment was successful but we could not refresh your session. Please log in again.");
      }
      setLoading(false);
    };

    // Small delay to let backend process the webhook
    const timer = setTimeout(refreshBusinessData, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a" }}>
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress sx={{ color: "#0ea5e9", mb: 3 }} size={48} />
          <Typography variant="h6" sx={{ color: "#e2e8f0" }}>Processing your payment...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at top left, rgba(14,165,233,0.18) 0%, #0b1220 40%, #0f172a 100%)",
        p: 3
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 480,
          width: "100%",
          p: { xs: 4, md: 5 },
          borderRadius: 3,
          textAlign: "center",
          background: "#fff",
          boxShadow: "0 24px 64px rgba(0,0,0,0.18)"
        }}
      >
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 3,
            boxShadow: "0 8px 24px rgba(16,185,129,0.3)"
          }}
        >
          <CheckCircleOutlineIcon sx={{ color: "#fff", fontSize: 40 }} />
        </Box>

        <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a", mb: 1 }}>
          Payment Successful!
        </Typography>

        <Typography variant="body1" sx={{ color: "#64748b", mb: 3 }}>
          {error || "Your subscription is now active. You have full access to all features."}
        </Typography>

        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={() => {
            window.location.href = "/";
          }}
          sx={{
            py: 1.4,
            fontWeight: 700,
            borderRadius: 2,
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            "&:hover": { background: "linear-gradient(135deg, #059669 0%, #047857 100%)" }
          }}
        >
          Go to Dashboard
        </Button>
      </Paper>
    </Box>
  );
}
