import React from "react";
import { Alert, Snackbar } from "@mui/material";

type ToastState = {
  message: string;
  severity: "success" | "error" | "info" | "warning";
} | null;

const ToastContext = React.createContext<{ notify: (message: string, severity?: ToastState["severity"]) => void } | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = React.useState<ToastState>(null);
  const lastToastRef = React.useRef<{ message: string; at: number } | null>(null);

  const pushToast = (message: string, severity: NonNullable<ToastState>["severity"]) => {
    const now = Date.now();
    const last = lastToastRef.current;
    if (last && last.message === message && now - last.at < 1200) {
      return;
    }
    lastToastRef.current = { message, at: now };
    setToast({ message, severity });
  };

  const notify = (message: string, severity: ToastState["severity"] = "info") => {
    pushToast(message, severity || "info");
  };

  React.useEffect(() => {
    const onApiError = (event: Event) => {
      const custom = event as CustomEvent<{ message?: string }>;
      const message = custom.detail?.message || "Request failed";
      pushToast(message, "error");
    };
    window.addEventListener("api:error", onApiError as EventListener);
    return () => window.removeEventListener("api:error", onApiError as EventListener);
  }, []);

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
