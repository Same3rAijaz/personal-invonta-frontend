import React from "react";
import { login as loginApi } from "../api/auth";
import { api } from "../api/client";

type AuthState = {
  token: string | null;
  user: any | null;
  business: any | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (nextUser: any | null) => void;
};

const AuthContext = React.createContext<AuthState | undefined>(undefined);

function parseJwtExpiry(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const payload = JSON.parse(atob(padded));
    const exp = Number(payload?.exp);
    if (!Number.isFinite(exp)) return null;
    return exp * 1000;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = React.useState<string | null>(localStorage.getItem("accessToken"));
  const [user, setUser] = React.useState<any | null>(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [business, setBusiness] = React.useState<any | null>(() => {
    const saved = localStorage.getItem("business");
    return saved ? JSON.parse(saved) : null;
  });

  const clearSessionAndRedirect = React.useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("business");
    setToken(null);
    setUser(null);
    setBusiness(null);
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }, []);

  React.useEffect(() => {
    if (!token) return;
    const expiresAt = parseJwtExpiry(token);
    if (!expiresAt) return;
    const checkExpiry = () => {
      if (Date.now() >= expiresAt) {
        clearSessionAndRedirect();
      }
    };
    checkExpiry();
    // Use interval checks to avoid browser setTimeout overflow for long durations (e.g., 30d).
    const interval = window.setInterval(checkExpiry, 60 * 1000);
    return () => window.clearInterval(interval);
  }, [token, clearSessionAndRedirect]);

  React.useEffect(() => {
    const fetchBusiness = async () => {
      if (!token || user?.role !== "ADMIN") return;
      try {
        const { data } = await api.get("/businesses/me");
        localStorage.setItem("business", JSON.stringify(data.data));
        setBusiness(data.data);
      } catch {
        // Ignore refresh errors; user can re-login if needed.
      }
    };
    fetchBusiness();
  }, [token, user?.role]);

  const login = async (email: string, password: string) => {
    const result = await loginApi(email, password);
    localStorage.setItem("accessToken", result.accessToken);
    localStorage.setItem("refreshToken", result.refreshToken);
    localStorage.setItem("user", JSON.stringify(result.user));
    if (result.business) {
      localStorage.setItem("business", JSON.stringify(result.business));
    }
    setToken(result.accessToken);
    setUser(result.user);
    setBusiness(result.business || null);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("business");
    setToken(null);
    setUser(null);
    setBusiness(null);
  };

  const updateUser = (nextUser: any | null) => {
    if (nextUser) {
      localStorage.setItem("user", JSON.stringify(nextUser));
    } else {
      localStorage.removeItem("user");
    }
    setUser(nextUser);
  };

  return (
    <AuthContext.Provider value={{ token, user, business, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
