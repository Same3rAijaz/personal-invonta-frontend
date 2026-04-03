import React from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "../lib/firebase";
import { useQueryClient } from "@tanstack/react-query";

type MarketplaceSession = {
  accessToken: string;
  refreshToken: string;
  user: any;
};

type MarketplaceProfile = {
  email?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
};

type MarketplaceAuthState = {
  accessToken: string | null;
  user: any | null;
  profile: MarketplaceProfile | null;
  isAuthenticated: boolean;
  login: (session: MarketplaceSession) => void;
  logout: () => void;
};

const MARKETPLACE_ACCESS_TOKEN_KEY = "marketplaceAccessToken";
const MARKETPLACE_REFRESH_TOKEN_KEY = "marketplaceRefreshToken";
const MARKETPLACE_USER_KEY = "marketplaceUser";
const MARKETPLACE_PROFILE_KEY = "marketplaceProfile";

const MarketplaceAuthContext = React.createContext<MarketplaceAuthState | undefined>(undefined);

function buildMarketplaceProfile(user: any, overrides?: Partial<MarketplaceProfile> | null): MarketplaceProfile {
  const firebaseUser = getFirebaseAuth().currentUser;
  return {
    email: overrides?.email ?? user?.email ?? firebaseUser?.email ?? null,
    fullName: overrides?.fullName ?? user?.fullName ?? user?.name ?? firebaseUser?.displayName ?? user?.email ?? firebaseUser?.email ?? null,
    avatarUrl: overrides?.avatarUrl ?? user?.avatarUrl ?? user?.photoURL ?? firebaseUser?.photoURL ?? null
  };
}

export function MarketplaceAuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [accessToken, setAccessToken] = React.useState<string | null>(localStorage.getItem(MARKETPLACE_ACCESS_TOKEN_KEY));
  const [user, setUser] = React.useState<any | null>(() => {
    const saved = localStorage.getItem(MARKETPLACE_USER_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [profile, setProfile] = React.useState<MarketplaceProfile | null>(() => {
    const saved = localStorage.getItem(MARKETPLACE_PROFILE_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  React.useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        localStorage.removeItem(MARKETPLACE_ACCESS_TOKEN_KEY);
        localStorage.removeItem(MARKETPLACE_USER_KEY);
        localStorage.removeItem(MARKETPLACE_PROFILE_KEY);
        setAccessToken(null);
        setUser(null);
        setProfile(null);
        queryClient.removeQueries({ queryKey: ["public-favorites"] });
        return;
      }
      const nextProfile = buildMarketplaceProfile(user, {
        email: firebaseUser.email,
        fullName: firebaseUser.displayName,
        avatarUrl: firebaseUser.photoURL
      });
      localStorage.setItem(MARKETPLACE_PROFILE_KEY, JSON.stringify(nextProfile));
      setProfile(nextProfile);
    });
    return () => unsubscribe();
  }, []);

  const login = (session: MarketplaceSession) => {
    localStorage.setItem(MARKETPLACE_ACCESS_TOKEN_KEY, session.accessToken);
    localStorage.setItem(MARKETPLACE_REFRESH_TOKEN_KEY, session.refreshToken);
    localStorage.setItem(MARKETPLACE_USER_KEY, JSON.stringify(session.user));
    const nextProfile = buildMarketplaceProfile(session.user, profile);
    localStorage.setItem(MARKETPLACE_PROFILE_KEY, JSON.stringify(nextProfile));
    setAccessToken(session.accessToken);
    setUser(session.user);
    setProfile(nextProfile);
  };

  const logout = () => {
    localStorage.removeItem(MARKETPLACE_ACCESS_TOKEN_KEY);
    localStorage.removeItem(MARKETPLACE_REFRESH_TOKEN_KEY);
    localStorage.removeItem(MARKETPLACE_USER_KEY);
    localStorage.removeItem(MARKETPLACE_PROFILE_KEY);
    setAccessToken(null);
    setUser(null);
    setProfile(null);
    queryClient.removeQueries({ queryKey: ["public-favorites"] });
  };

  const isAuthenticated = Boolean(profile?.email || user?.email || accessToken);

  return (
    <MarketplaceAuthContext.Provider value={{ accessToken, user, profile, isAuthenticated, login, logout }}>
      {children}
    </MarketplaceAuthContext.Provider>
  );
}

export function useMarketplaceAuth() {
  const ctx = React.useContext(MarketplaceAuthContext);
  if (!ctx) throw new Error("useMarketplaceAuth must be used within MarketplaceAuthProvider");
  return ctx;
}
