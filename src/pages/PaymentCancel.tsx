import { Box, Button, Paper, Typography } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function PaymentCancel() {
  const { logout } = useAuth();
  const navigate = useNavigate();

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
            background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 3,
            boxShadow: "0 8px 24px rgba(245,158,11,0.3)"
          }}
        >
          <ErrorOutlineIcon sx={{ color: "#fff", fontSize: 40 }} />
        </Box>

        <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a", mb: 1 }}>
          Payment Cancelled
        </Typography>

        <Typography variant="body1" sx={{ color: "#64748b", mb: 4 }}>
          Your payment was cancelled. You need an active subscription to access the dashboard.
        </Typography>

        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={() => navigate("/subscription")}
          sx={{
            py: 1.4,
            fontWeight: 700,
            borderRadius: 2,
            background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
            "&:hover": { background: "linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)" }
          }}
        >
          Try Again
        </Button>

        <Button
          variant="text"
          fullWidth
          onClick={logout}
          sx={{ mt: 2, color: "#94a3b8", fontWeight: 600 }}
        >
          Logout
        </Button>
      </Paper>
    </Box>
  );
}
