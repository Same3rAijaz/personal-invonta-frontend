import React from "react";
import { Box, Typography, keyframes } from "@mui/material";

const spin = keyframes`
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const spinReverse = keyframes`
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(-360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.5; transform: scale(0.92); }
  50%       { opacity: 1;   transform: scale(1); }
`;

const shimmer = keyframes`
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

export default function CustomLoader() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2.5,
        animation: `${fadeIn} 0.35s ease`,
      }}
    >
      {/* Orbital ring system */}
      <Box sx={{ position: "relative", width: 88, height: 88 }}>
        {/* Outer orbit ring */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2.5px solid transparent",
            borderTopColor: "#0ea5e9",
            borderRightColor: "#0ea5e940",
            animation: `${spin} 1.1s linear infinite`,
          }}
        />

        {/* Middle orbit ring */}
        <Box
          sx={{
            position: "absolute",
            inset: 10,
            borderRadius: "50%",
            border: "2px solid transparent",
            borderTopColor: "#6366f1",
            borderLeftColor: "#6366f140",
            animation: `${spinReverse} 0.9s linear infinite`,
          }}
        />

        {/* Inner orbit ring */}
        <Box
          sx={{
            position: "absolute",
            inset: 20,
            borderRadius: "50%",
            border: "1.5px solid transparent",
            borderTopColor: "#22d3ee",
            animation: `${spin} 0.7s linear infinite`,
          }}
        />

        {/* Center logo */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            component="img"
            src="/Invonta.png"
            alt="Invonta"
            sx={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              animation: `${pulse} 1.8s ease-in-out infinite`,
              objectFit: "contain",
            }}
          />
        </Box>
      </Box>

      {/* Brand name with shimmer */}
      <Box sx={{ textAlign: "center" }}>
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: "1rem",
            letterSpacing: "0.08em",
            background: (theme) =>
              theme.palette.mode === "dark"
                ? "linear-gradient(90deg, #e2e8f0 20%, #0ea5e9 50%, #6366f1 65%, #e2e8f0 80%)"
                : "linear-gradient(90deg, #0f172a 20%, #0ea5e9 50%, #6366f1 65%, #0f172a 80%)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: `${shimmer} 2.4s linear infinite`,
          }}
        >
          INVONTA
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: "#94a3b8",
            letterSpacing: "0.12em",
            fontWeight: 500,
            display: "block",
            mt: 0.25,
          }}
        >
          Loading…
        </Typography>
      </Box>
    </Box>
  );
}
