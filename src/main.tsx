import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { theme } from "./theme";
import { AuthProvider } from "./hooks/useAuth";
import { MarketplaceAuthProvider } from "./hooks/useMarketplaceAuth";
import { ToastProvider } from "./hooks/useToast";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <MarketplaceAuthProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </MarketplaceAuthProvider>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
);
