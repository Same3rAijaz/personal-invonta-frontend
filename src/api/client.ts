import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://www.invonta.com/api"
});

type RetryableRequest = {
  _retry?: boolean;
  skipAuth?: boolean;
  skipLoader?: boolean;
  skipGlobalErrorToast?: boolean;
  headers?: any;
  [key: string]: any;
};

let refreshPromise: Promise<string | null> | null = null;
let pendingRequests = 0;

function emitLoading() {
  window.dispatchEvent(new CustomEvent("api:loading", { detail: { pending: pendingRequests } }));
}

function startLoading(config: RetryableRequest) {
  if (config.skipLoader) return;
  pendingRequests += 1;
  emitLoading();
}

function stopLoading(config?: RetryableRequest) {
  if (config?.skipLoader) return;
  pendingRequests = Math.max(0, pendingRequests - 1);
  emitLoading();
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) return null;
      const { data } = await api.post("/auth/refresh", { refreshToken }, { skipAuth: true, skipLoader: true, skipGlobalErrorToast: true } as any);
      const nextAccessToken = data?.data?.accessToken;
      const nextRefreshToken = data?.data?.refreshToken;
      if (!nextAccessToken || !nextRefreshToken) return null;
      localStorage.setItem("accessToken", nextAccessToken);
      localStorage.setItem("refreshToken", nextRefreshToken);
      if (data?.data?.user) localStorage.setItem("user", JSON.stringify(data.data.user));
      if (data?.data?.business) localStorage.setItem("business", JSON.stringify(data.data.business));
      return nextAccessToken as string;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function clearSessionAndRedirect() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("business");
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

api.interceptors.request.use((config) => {
  startLoading(config as RetryableRequest);
  if ((config as any).skipAuth) {
    return config;
  }
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    stopLoading(response?.config as RetryableRequest);
    return response;
  },
  async (error) => {
    stopLoading(error?.config as RetryableRequest);
    const status = error?.response?.status;
    const originalRequest: RetryableRequest | undefined = error?.config;
    if (status === 401) {
      if (originalRequest && !originalRequest._retry && !String(originalRequest.url || "").includes("/auth/refresh")) {
        originalRequest._retry = true;
        try {
          const nextAccessToken = await refreshAccessToken();
          if (nextAccessToken) {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
            return api.request(originalRequest);
          }
        } catch {
          clearSessionAndRedirect();
          return Promise.reject(error);
        }
      }
      clearSessionAndRedirect();
    }
    const message = error?.response?.data?.error?.message || error?.message || "Request failed";
    if (!originalRequest?.skipGlobalErrorToast && status && status !== 401) {
      window.dispatchEvent(new CustomEvent("api:error", { detail: { message } }));
    }
    return Promise.reject(error);
  }
);
