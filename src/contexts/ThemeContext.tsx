import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import { ThemeProvider as MUIThemeProvider, createTheme } from "@mui/material/styles";
import { getThemeOptions } from "../theme";

type ThemeMode = "light" | "dark";

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: "light",
  toggleTheme: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("invonta-theme");
    return (saved === "dark" || saved === "light") ? saved : "light";
  });

  const toggleTheme = () => {
    setMode((prev) => {
      const nextMode = prev === "light" ? "dark" : "light";
      localStorage.setItem("invonta-theme", nextMode);
      return nextMode;
    });
  };

  const theme = useMemo(() => createTheme(getThemeOptions(mode)), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MUIThemeProvider theme={theme}>
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};
