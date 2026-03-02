import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export function useProducts(params?: { page?: number; limit?: number; search?: string; filters?: Record<string, string> }) {
  return useQuery({
    queryKey: ["products", params?.page, params?.limit, params?.search, params?.filters],
    queryFn: async () =>
      (
        await api.get("/products", {
          params: {
            page: params?.page,
            limit: params?.limit,
            search: params?.search,
            filters:
              params?.filters && Object.keys(params.filters).length > 0
                ? JSON.stringify(params.filters)
                : undefined
          }
        })
      ).data.data
  });
}

export function useProduct(id?: string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => (await api.get(`/products/${id}`)).data.data,
    enabled: !!id
  });
}

export function useCreateProduct() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => (await api.post("/products", payload)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["products"] })
  });
}

export function useUpdateProduct() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) =>
      (await api.patch(`/products/${id}`, payload)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["products"] })
  });
}

export function useDeleteProduct() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/products/${id}`)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["products"] })
  });
}

export function useProductShareTargets(search?: string, enabled = true) {
  return useQuery({
    queryKey: ["product-share-targets", search],
    queryFn: async () => (await api.get("/products/share-targets/list", { params: { search } })).data.data,
    enabled
  });
}

export function useShareProduct() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, businessIds }: { id: string; businessIds: string[] }) =>
      (await api.patch(`/products/${id}/share`, { businessIds })).data.data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["products"] });
    }
  });
}
