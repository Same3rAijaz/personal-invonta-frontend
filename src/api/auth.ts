import { api } from "./client";

export async function login(email: string, password: string) {
  const { data } = await api.post("/auth/login", { email, password });
  return data.data;
}

export async function signup(email: string, password: string, referralCode?: string) {
  const { data } = await api.post("/auth/signup", { email, password, referralCode });
  return data.data;
}

export async function forgotPassword(email: string) {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data.data;
}

export async function resetPassword(token: string, password: string) {
  const { data } = await api.post("/auth/reset-password", { token, password });
  return data.data;
}

export async function firebaseGoogleLogin(firebaseIdToken: string) {
  const { data } = await api.post(
    "/auth/firebase/google",
    { firebaseIdToken },
    { skipAuth: true, skipGlobalErrorToast: true } as any
  );
  return data.data;
}
