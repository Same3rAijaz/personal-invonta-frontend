import React from "react";
import { Box, Typography, Button, Stack, Paper } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

export default function SubscriptionBlocked() {
  const month = new Date().toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0c1220 0%, #0d1117 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 480,
          width: "100%",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: 4,
          p: { xs: 3, sm: 5 },
          textAlign: "center",
        }}
      >
        {/* Icon */}
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "rgba(239,68,68,0.12)",
            border: "2px solid rgba(239,68,68,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 3,
          }}
        >
          <LockOutlinedIcon sx={{ fontSize: 34, color: "#ef4444" }} />
        </Box>

        {/* Heading */}
        <Typography
          variant="h5"
          sx={{ fontWeight: 800, color: "#f8fafc", mb: 1, letterSpacing: "-0.02em" }}
        >
          Subscription Paused
        </Typography>

        <Typography sx={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.7, mb: 3 }}>
          Your <strong style={{ color: "#f8fafc" }}>{month}</strong> subscription payment has not
          been confirmed yet. Access is temporarily suspended until your payment is approved by the
          administrator.
        </Typography>

        <Box
          sx={{
            background: "rgba(251,191,36,0.08)",
            border: "1px solid rgba(251,191,36,0.22)",
            borderRadius: 2,
            px: 2.5,
            py: 1.8,
            mb: 3,
            textAlign: "left",
          }}
        >
          <Typography sx={{ fontSize: "0.78rem", color: "#fbbf24", fontWeight: 600, mb: 0.5 }}>
            What happens next?
          </Typography>
          <Typography sx={{ fontSize: "0.78rem", color: "#94a3b8", lineHeight: 1.7 }}>
            1. Contact your Invonta administrator to confirm payment.<br />
            2. Once approved, you can log back in immediately.<br />
            3. All your data is safe and untouched.
          </Typography>
        </Box>

        <Stack spacing={1.5}>
          <Button
            variant="contained"
            startIcon={<WhatsAppIcon />}
            href="https://wa.me/923000000000"
            target="_blank"
            sx={{
              background: "#25d366",
              "&:hover": { background: "#1ebe5d" },
              borderRadius: 2,
              fontWeight: 700,
              textTransform: "none",
            }}
          >
            Contact via WhatsApp
          </Button>
          <Button
            variant="outlined"
            startIcon={<EmailOutlinedIcon />}
            href="mailto:support@invonta.app"
            sx={{
              borderColor: "rgba(255,255,255,0.15)",
              color: "#94a3b8",
              borderRadius: 2,
              fontWeight: 600,
              textTransform: "none",
              "&:hover": { borderColor: "rgba(255,255,255,0.3)", color: "#f8fafc" },
            }}
          >
            Email Support
          </Button>
          <Button
            variant="text"
            onClick={() => { window.location.href = "/login"; }}
            sx={{ color: "#64748b", fontSize: "0.78rem", textTransform: "none" }}
          >
            Back to login
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
