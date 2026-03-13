import React from "react";
import { Box, keyframes } from "@mui/material";

const pulse = keyframes`
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(33, 166, 223, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 20px rgba(33, 166, 223, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(33, 166, 223, 0);
  }
`;

const float = keyframes`
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
`;

export default function CustomLoader() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        component="img"
        src="/Invonta.png"
        alt="Invonta Loader"
        sx={{
          width: 80,
          height: 80,
          mb: 2,
          animation: `${float} 2s ease-in-out infinite, ${pulse} 2s infinite`,
          borderRadius: "50%",
        }}
      />
      <Box
        sx={{
          display: "flex",
          gap: 0.5,
        }}
      >
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: "#21a6df",
              animation: `bounce 1.4s infinite ease-in-out both`,
              animationDelay: `${i * 0.16}s`,
              "@keyframes bounce": {
                "0%, 80%, 100%": {
                  transform: "scale(0)",
                },
                "40%": {
                  transform: "scale(1)",
                },
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
