import { ThemeOptions } from "@mui/material/styles";

export const getThemeOptions = (mode: "light" | "dark"): ThemeOptions => {
  const isDark = mode === "dark";

  return {
    palette: {
      mode,
      primary: { main: isDark ? "#38bdf8" : "#0b1220" },
      secondary: { main: "#0ea5e9" },
      background: { 
        default: isDark ? "#020617" : "#f1f5f9", 
        paper: isDark ? "rgba(15, 23, 42, 0.75)" : "rgba(255, 255, 255, 0.75)" 
      },
      success: { main: "#16a34a" },
      warning: { main: "#f59e0b" },
      error: { main: "#e11d48" },
      text: { 
        primary: isDark ? "#f8fafc" : "#0f172a", 
        secondary: isDark ? "#94a3b8" : "#475569" 
      }
    },
    typography: {
      fontFamily: "'Plus Jakarta Sans', 'Sora', 'DM Sans', sans-serif",
      h1: { fontWeight: 700, letterSpacing: -1.2 },
      h2: { fontWeight: 700, letterSpacing: -0.9 },
      h3: { fontWeight: 700, letterSpacing: -0.7 },
      h4: { fontWeight: 700, letterSpacing: -0.5 },
      h5: { fontWeight: 700, letterSpacing: -0.4 },
      h6: { fontWeight: 700, letterSpacing: -0.2 },
      subtitle1: { fontWeight: 600 },
      button: { textTransform: "none", fontWeight: 600 }
    },
    shape: { borderRadius: 16 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          "@keyframes fadeInUp": {
            "0%": { opacity: 0, transform: "translateY(8px)" },
            "100%": { opacity: 1, transform: "translateY(0)" }
          },
          body: {
            backgroundColor: isDark ? "#020617" : "#f5f7fb",
            color: isDark ? "#f8fafc" : "#0f172a",
            transition: "background-color 0.3s ease, color 0.3s ease"
          },
          "*": {
            boxSizing: "border-box"
          },
          "*::-webkit-scrollbar": {
            width: "10px",
            height: "10px"
          },
          "*::-webkit-scrollbar-thumb": {
            backgroundColor: isDark ? "rgba(248,250,252,0.15)" : "rgba(15,23,42,0.2)",
            borderRadius: "999px"
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? "rgba(15, 23, 42, 0.55)" : "rgba(255, 255, 255, 0.55)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.6)"}`,
            boxShadow: isDark ? "0 8px 32px 0 rgba(0,0,0,0.4)" : "0 8px 32px 0 rgba(15,23,42,0.06)",
          }
        }
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true
        },
        styleOverrides: {
          root: {
            borderRadius: 12,
            paddingLeft: 18,
            paddingRight: 18
          },
          contained: {
            boxShadow: isDark ? "0 10px 24px rgba(14,165,233,0.1)" : "0 10px 24px rgba(14,165,233,0.2)"
          }
        }
      },
      MuiTextField: {
        defaultProps: {
          variant: "outlined",
          size: "small"
        }
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            backgroundColor: isDark ? "rgba(15, 23, 42, 0.4)" : "rgba(255, 255, 255, 0.5)",
            backdropFilter: "blur(8px)",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: isDark ? "rgba(148,163,184,0.15)" : "rgba(148,163,184,0.3)"
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: isDark ? "rgba(148,163,184,0.4)" : "rgba(100,116,139,0.7)"
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#0ea5e9"
            }
          }
        }
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: isDark ? "#94a3b8" : "#64748b"
          }
        }
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 700,
            color: isDark ? "#f8fafc" : "#0f172a",
            backgroundColor: isDark ? "#0f172a" : "#f1f5f9"
          },
          root: {
            paddingTop: 10,
            paddingBottom: 10,
            borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 10
          }
        }
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(148,163,184,0.2)"
          }
        }
      }
    }
  };
};
