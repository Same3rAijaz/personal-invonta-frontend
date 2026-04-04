import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import { useThemeMode } from "../contexts/ThemeContext";

export default function ThemeToggle({ sx }: { sx?: any }) {
  const { mode, toggleTheme } = useThemeMode();

  return (
    <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
      <IconButton 
        onClick={toggleTheme} 
        sx={{ 
          color: "text.secondary",
          bgcolor: mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)",
          backdropFilter: "blur(8px)",
          "&:hover": {
            bgcolor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)",
          },
          ...sx 
        }}
      >
        {mode === 'light' ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />}
      </IconButton>
    </Tooltip>
  );
}
