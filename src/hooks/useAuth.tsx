import React from "react";
import { login as loginApi } from "../api/auth";
import { api } from "../api/client";
import {
  AUTH_SESSION_CHANGED_EVENT,
  clearStoredAuthSession,
  readStoredAuthSession,
  writeStoredAuthSession
} from "../utils/authSession";

type AuthState = {
  token: string | null;
  user: any | null;
  business: any | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (nextUser: any | null) => void;
};

const AuthContext = React.createContext<AuthState | undefined>(undefined);

function decodeJwtPayload(token: string | null | undefined): any | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function parseJwtExpiry(token: string) {
  const payload = decodeJwtPayload(token);
  const exp = Number(payload?.exp);
  if (!Number.isFinite(exp)) return null;
  return exp * 1000;
}

/**
 * Returns the role claim from the JWT itself (NOT from the localStorage user
 * object). This is what protected routes should use, because a user can
 * trivially edit `localStorage.user.role` to "SUPER_ADMIN" but cannot forge
 * a signed JWT. The backend is the ultimate source of truth — these client
 * checks just keep honest users out of the wrong UI. (BUG-011.)
 */
export function getRoleFromToken(token: string | null | undefined): string | null {
  const payload = decodeJwtPayload(token);
  return payload?.role || null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = React.useState<string | null>(() => readStoredAuthSession().accessToken);
  const [user, setUser] = React.useState<any | null>(() => readStoredAuthSession().user);
  const [business, setBusiness] = React.useState<any | null>(() => readStoredAuthSession().business);

  const clearSessionAndRedirect = React.useCallback(() => {
    clearStoredAuthSession();
    setToken(null);
    setUser(null);
    setBusiness(null);
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }, []);

  React.useEffect(() => {
    const syncFromStorage = () => {
      const session = readStoredAuthSession();
      setToken(session.accessToken);
      setUser(session.user);
      setBusiness(session.business);
    };

    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, syncFromStorage);
    window.addEventListener("storage", syncFromStorage);

    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, syncFromStorage);
      window.removeEventListener("storage", syncFromStorage);
    };
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
      if (!token || !user?.businessId || user?.role === "SUPER_ADMIN") return;
      const lastSync = Number(sessionStorage.getItem("invonta:business-sync") || 0);
      if (Date.now() - lastSync < 5 * 60_000 && business) return;
      try {
        const { data } = await api.get("/businesses/me", { skipLoader: true } as any);
        writeStoredAuthSession({
          accessToken: token,
          refreshToken: readStoredAuthSession().refreshToken,
          user,
          business: data.data
        });
        sessionStorage.setItem("invonta:business-sync", String(Date.now()));
        setBusiness(data.data);
      } catch {
        // Ignore refresh errors; user can re-login if needed.
      }
    };
    fetchBusiness();
  }, [token, user?.businessId, user?.role]);

  const login = React.useCallback(async (email: string, password: string) => {
    const result = await loginApi(email, password);
    writeStoredAuthSession({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
      business: result.business || null
    });
    sessionStorage.removeItem("invonta:business-sync");
    setToken(result.accessToken);
    setUser(result.user);
    setBusiness(result.business || null);
  }, []);

  const logout = React.useCallback(() => {
    api.post("/auth/logout").catch(() => {});
    clearStoredAuthSession();
    sessionStorage.removeItem("invonta:business-sync");
    setToken(null);
    setUser(null);
    setBusiness(null);
  }, []);

  const updateUser = React.useCallback((nextUser: any | null) => {
    writeStoredAuthSession({
      accessToken: token,
      refreshToken: readStoredAuthSession().refreshToken,
      user: nextUser,
      business
    });
    setUser(nextUser);
  }, [token, business]);

  const value = React.useMemo(
    () => ({ token, user, business, login, logout, updateUser }),
    [token, user, business, login, logout, updateUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
