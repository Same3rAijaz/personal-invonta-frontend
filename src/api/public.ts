import { api } from "./client";
import { firebaseGoogleLogin } from "./auth";
import { getFirebaseAuth } from "../lib/firebase";

export type PublicProductFilters = {
  page?: number;
  limit?: number;
  search?: string;
  marketId?: string;
  country?: string;
  state?: string;
  city?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "name_asc";
};

export type PublicShopFilters = {
  page?: number;
  limit?: number;
  search?: string;
  marketId?: string;
  country?: string;
  state?: string;
  city?: string;
  category?: string;
  minProducts?: number;
  maxProducts?: number;
  sort?: "newest" | "name_asc";
};

export type PublicCategoryNode = {
  _id: string;
  name: string;
  parentId?: string | null;
  level?: number;
  pathNames?: string[];
  pathIds?: string[];
  path?: string;
  hasAnyPublicProduct?: boolean;
};

export async function listPublicProducts(params: PublicProductFilters) {
  const { data } = await api.get("/public/products", { params });
  return data.data;
}

export async function listPublicMarkets(search?: string) {
  const { data } = await api.get("/public/markets", { params: { search } });
  return data.data;
}

export async function listPublicCategories(marketId?: string): Promise<PublicCategoryNode[]> {
  const { data } = await api.get("/public/products/categories", { params: { marketId } });
  return (data.data || []) as PublicCategoryNode[];
}

export async function getPublicProductDetail(id: string, relatedLimit = 6) {
  const { data } = await api.get(`/public/products/${id}`, { params: { relatedLimit } });
  return data.data;
}

export async function listPublicShops(params: PublicShopFilters) {
  const { data } = await api.get("/public/shops", { params });
  return data.data;
}

export async function getPublicShopDetail(
  id: string,
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: "newest" | "price_asc" | "price_desc" | "name_asc";
  }
) {
  const { data } = await api.get(`/public/shops/${id}`, { params });
  return data.data;
}

export async function getPublicShopDetailBySlug(
  slug: string,
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: "newest" | "price_asc" | "price_desc" | "name_asc";
  }
) {
  const { data } = await api.get(`/public/shops/by-slug/${encodeURIComponent(slug)}`, { params });
  return data.data;
}

export async function listPublicShopReviews(id: string, params?: { page?: number; limit?: number }) {
  const { data } = await api.get(`/public/shops/${id}/reviews`, { params });
  return data.data;
}

export async function listPublicShopReviewsBySlug(slug: string, params?: { page?: number; limit?: number }) {
  const { data } = await api.get(`/public/shops/by-slug/${encodeURIComponent(slug)}/reviews`, { params });
  return data.data;
}

export async function upsertPublicShopReview(id: string, payload: { rating: number; comment?: string }) {
  const marketplaceAccessToken = await ensureMarketplaceAccessToken();
  try {
    const { data } = await api.post(`/public/shops/${id}/reviews`, payload, {
      skipAuth: true,
      headers: marketplaceAccessToken ? { Authorization: `Bearer ${marketplaceAccessToken}` } : undefined
    } as any);
    return data.data;
  } catch (error: any) {
    if (error?.response?.status === 401) {
      const nextToken = await ensureMarketplaceAccessToken(true);
      const { data } = await api.post(`/public/shops/${id}/reviews`, payload, {
        skipAuth: true,
        headers: nextToken ? { Authorization: `Bearer ${nextToken}` } : undefined
      } as any);
      return data.data;
    }
    throw error;
  }
}

export async function upsertPublicShopReviewBySlug(slug: string, payload: { rating: number; comment?: string }) {
  const marketplaceAccessToken = await ensureMarketplaceAccessToken();
  try {
    const { data } = await api.post(`/public/shops/by-slug/${encodeURIComponent(slug)}/reviews`, payload, {
      skipAuth: true,
      headers: marketplaceAccessToken ? { Authorization: `Bearer ${marketplaceAccessToken}` } : undefined
    } as any);
    return data.data;
  } catch (error: any) {
    if (error?.response?.status === 401) {
      const nextToken = await ensureMarketplaceAccessToken(true);
      const { data } = await api.post(`/public/shops/by-slug/${encodeURIComponent(slug)}/reviews`, payload, {
        skipAuth: true,
        headers: nextToken ? { Authorization: `Bearer ${nextToken}` } : undefined
      } as any);
      return data.data;
    }
    throw error;
  }
}

async function ensureMarketplaceAccessToken(forceRefresh = false): Promise<string | null> {
  if (!forceRefresh) {
    const existing = localStorage.getItem("marketplaceAccessToken");
    if (existing) return existing;
  }

  const refreshToken = localStorage.getItem("marketplaceRefreshToken");
  if (refreshToken) {
    try {
      const refreshResponse = await api.post(
        "/auth/refresh",
        { refreshToken },
        { skipAuth: true, skipLoader: true, skipGlobalErrorToast: true } as any
      );
      const refreshed = refreshResponse?.data?.data;
      const nextAccessToken = refreshed?.accessToken as string | undefined;
      const nextRefreshToken = refreshed?.refreshToken as string | undefined;
      if (nextAccessToken) {
        localStorage.setItem("marketplaceAccessToken", nextAccessToken);
        if (nextRefreshToken) localStorage.setItem("marketplaceRefreshToken", nextRefreshToken);
        if (refreshed?.user) localStorage.setItem("marketplaceUser", JSON.stringify(refreshed.user));
        return nextAccessToken;
      }
    } catch {
      // Fall back to Firebase token exchange below.
    }
  }

  const firebaseUser = getFirebaseAuth().currentUser;
  if (!firebaseUser) return null;

  const firebaseIdToken = await firebaseUser.getIdToken(forceRefresh);
  const session = await firebaseGoogleLogin(firebaseIdToken);
  if (!session?.accessToken) return null;

  localStorage.setItem("marketplaceAccessToken", session.accessToken);
  if (session.refreshToken) localStorage.setItem("marketplaceRefreshToken", session.refreshToken);
  if (session.user) localStorage.setItem("marketplaceUser", JSON.stringify(session.user));

  return session.accessToken;
}
