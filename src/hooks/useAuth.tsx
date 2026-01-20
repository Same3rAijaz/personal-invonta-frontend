import React from "react";
import { login as loginApi } from "../api/auth";
import { api } from "../api/client";

type AuthState = {
  token: string | null;
  user: any | null;
  business: any | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = React.createContext<AuthState | undefined>(undefined);

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

  return (
    <AuthContext.Provider value={{ token, user, business, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
