import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#0f172a" },
    secondary: { main: "#f97316" },
    background: { default: "#f8fafc", paper: "#ffffff" },
    success: { main: "#16a34a" }
  },
  typography: {
    fontFamily: "'DM Sans', sans-serif",
    h5: { letterSpacing: -0.5 }
  },
  shape: { borderRadius: 14 }
});
