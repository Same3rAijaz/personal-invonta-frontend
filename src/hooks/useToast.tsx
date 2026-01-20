import React from "react";
import { Alert, Snackbar } from "@mui/material";

type ToastState = {
  message: string;
  severity: "success" | "error" | "info" | "warning";
} | null;

const ToastContext = React.createContext<{ notify: (message: string, severity?: ToastState["severity"]) => void } | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = React.useState<ToastState>(null);

  const notify = (message: string, severity: ToastState["severity"] = "info") => {
    setToast({ message, severity });
  };

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)}>
        {toast ? <Alert severity={toast.severity}>{toast.message}</Alert> : null}
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}