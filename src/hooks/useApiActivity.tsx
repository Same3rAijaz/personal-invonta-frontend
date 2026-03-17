import React from "react";
import { Backdrop } from "@mui/material";

import CustomLoader from "../components/CustomLoader";

const ApiActivityContext = React.createContext<{ pending: number }>({ pending: 0 });
const SHOW_DELAY_MS = 350;
const MIN_VISIBLE_MS = 300;

export function ApiActivityProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = React.useState(0);
  const [visible, setVisible] = React.useState(false);
  const showTimerRef = React.useRef<number | null>(null);
  const hideTimerRef = React.useRef<number | null>(null);
  const visibleSinceRef = React.useRef<number>(0);

  React.useEffect(() => {
    const handleLoading = (event: Event) => {
      const custom = event as CustomEvent<{ pending?: number }>;
      const next = Number(custom.detail?.pending || 0);
      setPending(next > 0 ? next : 0);
    };
    window.addEventListener("api:loading", handleLoading as EventListener);
    return () => {
      window.removeEventListener("api:loading", handleLoading as EventListener);
      if (showTimerRef.current) {
        window.clearTimeout(showTimerRef.current);
      }
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (pending > 0) {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      if (!visible && !showTimerRef.current) {
        showTimerRef.current = window.setTimeout(() => {
          setVisible(true);
          visibleSinceRef.current = Date.now();
          showTimerRef.current = null;
        }, SHOW_DELAY_MS);
      }
      return;
    }

    if (showTimerRef.current) {
      window.clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }

    if (!visible) return;
    const elapsed = Date.now() - visibleSinceRef.current;
    const waitMs = Math.max(0, MIN_VISIBLE_MS - elapsed);

    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = window.setTimeout(() => {
      setVisible(false);
      hideTimerRef.current = null;
    }, waitMs);
  }, [pending, visible]);

  return (
    <ApiActivityContext.Provider value={{ pending }}>
      {children}
      <Backdrop open={visible} sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 9999, backgroundColor: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(4px)" }}>
        <CustomLoader />
      </Backdrop>
    </ApiActivityContext.Provider>
  );
}

export function useApiActivity() {
  return React.useContext(ApiActivityContext);
}
