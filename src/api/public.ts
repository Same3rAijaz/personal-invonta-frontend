import { api } from "./client";

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

export async function listPublicProducts(params: PublicProductFilters) {
  const { data } = await api.get("/public/products", { params });
  return data.data;
}

export async function listPublicMarkets(search?: string) {
  const { data } = await api.get("/public/markets", { params: { search } });
  return data.data;
}

export async function listPublicCategories(marketId?: string) {
  const { data } = await api.get("/public/products/categories", { params: { marketId } });
  return data.data;
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
