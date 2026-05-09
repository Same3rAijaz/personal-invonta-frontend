import { ThemeOptions } from "@mui/material/styles";

export const getThemeOptions = (mode: "light" | "dark"): ThemeOptions => {
  const isDark = mode === "dark";

  return {
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1536,
      },
    },
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
      // Fluid type: scales smoothly from mobile to desktop without media queries.
      h1: { fontWeight: 700, letterSpacing: -1.2, fontSize: "clamp(1.85rem, 5.6vw + 0.5rem, 3rem)" },
      h2: { fontWeight: 700, letterSpacing: -0.9, fontSize: "clamp(1.6rem, 4.6vw + 0.4rem, 2.5rem)" },
      h3: { fontWeight: 700, letterSpacing: -0.7, fontSize: "clamp(1.4rem, 3.4vw + 0.4rem, 2rem)" },
      h4: { fontWeight: 700, letterSpacing: -0.5, fontSize: "clamp(1.2rem, 2.4vw + 0.4rem, 1.6rem)" },
      h5: { fontWeight: 700, letterSpacing: -0.4, fontSize: "clamp(1.05rem, 1.6vw + 0.4rem, 1.35rem)" },
      h6: { fontWeight: 700, letterSpacing: -0.2, fontSize: "clamp(0.95rem, 1.2vw + 0.4rem, 1.15rem)" },
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
          html: {
            // Prevent iOS auto-zoom when focusing inputs (font < 16px triggers zoom).
            WebkitTextSizeAdjust: "100%",
          },
          body: {
            backgroundColor: isDark ? "#020617" : "#f5f7fb",
            color: isDark ? "#f8fafc" : "#0f172a",
            transition: "background-color 0.3s ease, color 0.3s ease",
            // Stop horizontal page scroll caused by stray wide elements on mobile.
            overflowX: "hidden",
          },
          "*": {
            boxSizing: "border-box"
          },
          // Long URLs / IDs / SKUs should never break the layout on small screens.
          "p, span, li, td, th, label, h1, h2, h3, h4, h5, h6": {
            overflowWrap: "anywhere",
          },
          img: {
            maxWidth: "100%",
            height: "auto",
            display: "block",
          },
          "*::-webkit-scrollbar": {
            width: "10px",
            height: "10px"
          },
          "*::-webkit-scrollbar-thumb": {
            backgroundColor: isDark ? "rgba(248,250,252,0.15)" : "rgba(15,23,42,0.2)",
            borderRadius: "999px"
          },
          "@media (max-width: 600px)": {
            // Slim the scrollbars on touch devices so they don't eat layout width.
            "*::-webkit-scrollbar": { width: "4px", height: "4px" },
          }
        }
      },
      MuiContainer: {
        styleOverrides: {
          root: ({ theme }) => ({
            paddingLeft: theme.spacing(2),
            paddingRight: theme.spacing(2),
            [theme.breakpoints.up("sm")]: {
              paddingLeft: theme.spacing(3),
              paddingRight: theme.spacing(3),
            },
            [theme.breakpoints.up("md")]: {
              paddingLeft: theme.spacing(4),
              paddingRight: theme.spacing(4),
            },
          }),
        },
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
          root: ({ theme }) => ({
            borderRadius: 12,
            paddingLeft: 18,
            paddingRight: 18,
            // Ensure 44px+ tap target on touch devices (WCAG 2.5.5 guideline).
            minHeight: 40,
            [theme.breakpoints.down("sm")]: {
              minHeight: 44,
              paddingLeft: 14,
              paddingRight: 14,
            },
          }),
          contained: {
            boxShadow: isDark ? "0 10px 24px rgba(14,165,233,0.1)" : "0 10px 24px rgba(14,165,233,0.2)"
          },
          sizeSmall: ({ theme }) => ({
            minHeight: 32,
            [theme.breakpoints.down("sm")]: {
              minHeight: 38,
            },
          }),
        }
      },
      MuiIconButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            [theme.breakpoints.down("sm")]: {
              padding: 8,
            },
          }),
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: "outlined",
          size: "small"
        }
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: ({ theme }) => ({
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
            },
            // 16px font on small screens prevents iOS Safari from zooming on focus.
            [theme.breakpoints.down("sm")]: {
              fontSize: 16,
            },
          })
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
          root: ({ theme }) => ({
            paddingTop: 10,
            paddingBottom: 10,
            borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
            [theme.breakpoints.down("sm")]: {
              paddingLeft: 8,
              paddingRight: 8,
              fontSize: "0.78rem",
            },
          })
        }
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            // Tables always need a horizontal scroll fallback on narrow screens.
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
          },
        },
      },
      MuiTablePagination: {
        styleOverrides: {
          root: ({ theme }) => ({
            overflowX: "auto",
            "& .MuiTablePagination-toolbar": {
              flexWrap: "wrap",
              rowGap: theme.spacing(1),
              paddingLeft: theme.spacing(1.5),
              paddingRight: theme.spacing(1.5),
              [theme.breakpoints.down("sm")]: {
                paddingLeft: theme.spacing(1),
                paddingRight: theme.spacing(1),
              },
            },
            "& .MuiTablePagination-spacer": {
              display: "none",
            },
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
              [theme.breakpoints.down("sm")]: {
                fontSize: "0.78rem",
              },
            },
          }),
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            maxWidth: "100%",
          }
        }
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(148,163,184,0.2)"
          }
        }
      },
      MuiDialog: {
        defaultProps: {
          // Reasonable default — dialogs already pass `fullWidth` where needed.
        },
        styleOverrides: {
          paper: ({ theme }) => ({
            [theme.breakpoints.down("sm")]: {
              margin: theme.spacing(1.5),
              width: `calc(100% - ${theme.spacing(3)})`,
              maxWidth: `calc(100% - ${theme.spacing(3)})`,
              maxHeight: `calc(100% - ${theme.spacing(3)})`,
              borderRadius: 14,
            },
          }),
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: ({ theme }) => ({
            [theme.breakpoints.down("sm")]: {
              padding: theme.spacing(2),
            },
          }),
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: ({ theme }) => ({
            [theme.breakpoints.down("sm")]: {
              padding: theme.spacing(1.5, 2),
              flexWrap: "wrap",
              "& > :not(:first-of-type)": {
                marginLeft: 0,
              },
              "& > *": {
                flex: "1 1 auto",
                minWidth: 100,
              },
            },
          }),
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: ({ theme }) => ({
            [theme.breakpoints.down("sm")]: {
              "&::before": { display: "none" },
            },
          }),
        },
      },
      MuiTooltip: {
        defaultProps: {
          // Tooltips are useless on touch and just clutter focus interactions.
          enterTouchDelay: 700,
          leaveTouchDelay: 1500,
        },
      },
    }
  };
};
