import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export function useProducts(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ["products", params?.page, params?.limit, params?.search],
    queryFn: async () => (await api.get("/products", { params })).data.data
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
