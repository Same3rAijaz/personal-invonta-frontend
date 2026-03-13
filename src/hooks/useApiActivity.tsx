import React from "react";
import { Backdrop, CircularProgress } from "@mui/material";

import CustomLoader from "../components/CustomLoader";

const ApiActivityContext = React.createContext<{ pending: number }>({ pending: 0 });

export function ApiActivityProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = React.useState(0);

  React.useEffect(() => {
    const handleLoading = (event: Event) => {
      const custom = event as CustomEvent<{ pending?: number }>;
      const next = Number(custom.detail?.pending || 0);
      setPending(next > 0 ? next : 0);
    };
    window.addEventListener("api:loading", handleLoading as EventListener);
    return () => window.removeEventListener("api:loading", handleLoading as EventListener);
  }, []);

  return (
    <ApiActivityContext.Provider value={{ pending }}>
      {children}
      <Backdrop open={pending > 0} sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 9999, backgroundColor: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(4px)" }}>
        <CustomLoader />
      </Backdrop>
    </ApiActivityContext.Provider>
  );
}

export function useApiActivity() {
  return React.useContext(ApiActivityContext);
}
