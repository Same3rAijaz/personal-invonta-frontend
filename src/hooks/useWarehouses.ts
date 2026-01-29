import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export function useWarehouses(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ["warehouses", params?.page, params?.limit, params?.search],
    queryFn: async () => (await api.get("/warehouses", { params })).data.data
  });
}

export function useCreateWarehouse() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => (await api.post("/warehouses", payload)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["warehouses"] })
  });
}

export function useUpdateWarehouse() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) =>
      (await api.patch(`/warehouses/${id}`, payload)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["warehouses"] })
  });
}

export function useDeleteWarehouse() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/warehouses/${id}`)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["warehouses"] })
  });
}
