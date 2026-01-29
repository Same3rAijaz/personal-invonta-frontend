import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#0b1220" },
    secondary: { main: "#0ea5e9" },
    background: { default: "#f5f7fb", paper: "#ffffff" },
    success: { main: "#16a34a" },
    warning: { main: "#f59e0b" },
    error: { main: "#e11d48" },
    text: { primary: "#0f172a", secondary: "#475569" }
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
          backgroundColor: "#f5f7fb",
          color: "#0f172a"
        },
        "*": {
          boxSizing: "border-box"
        },
        "*::-webkit-scrollbar": {
          width: "10px",
          height: "10px"
        },
        "*::-webkit-scrollbar-thumb": {
          backgroundColor: "rgba(15,23,42,0.2)",
          borderRadius: "999px"
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(148,163,184,0.18)",
          boxShadow: "0 16px 40px rgba(15,23,42,0.08)"
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
          boxShadow: "0 10px 24px rgba(14,165,233,0.2)"
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
          backgroundColor: "#ffffff",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(148,163,184,0.4)"
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(100,116,139,0.7)"
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
          color: "#64748b"
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          color: "#0f172a",
          backgroundColor: "#f1f5f9"
        },
        root: {
          paddingTop: 10,
          paddingBottom: 10
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
          borderRight: "1px solid rgba(148,163,184,0.2)"
        }
      }
    }
  }
});
