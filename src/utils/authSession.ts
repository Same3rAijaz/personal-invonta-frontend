export const AUTH_SESSION_CHANGED_EVENT = "invonta:auth-session-changed";

export type StoredAuthSession = {
  accessToken: string | null;
  refreshToken: string | null;
  user: any | null;
  business: any | null;
};

function parseStoredJson(key: string) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function readStoredAuthSession(): StoredAuthSession {
  return {
    accessToken: localStorage.getItem("accessToken"),
    refreshToken: localStorage.getItem("refreshToken"),
    user: parseStoredJson("user"),
    business: parseStoredJson("business"),
  };
}

export function dispatchAuthSessionChanged() {
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_CHANGED_EVENT));
}

export function writeStoredAuthSession(session: {
  accessToken?: string | null;
  refreshToken?: string | null;
  user?: any | null;
  business?: any | null;
}) {
  if (session.accessToken) localStorage.setItem("accessToken", session.accessToken);
  else localStorage.removeItem("accessToken");

  if (session.refreshToken) localStorage.setItem("refreshToken", session.refreshToken);
  else localStorage.removeItem("refreshToken");

  if (session.user) localStorage.setItem("user", JSON.stringify(session.user));
  else localStorage.removeItem("user");

  if (session.business) localStorage.setItem("business", JSON.stringify(session.business));
  else localStorage.removeItem("business");

  dispatchAuthSessionChanged();
}

export function clearStoredAuthSession() {
  writeStoredAuthSession({
    accessToken: null,
    refreshToken: null,
    user: null,
    business: null,
  });
}
