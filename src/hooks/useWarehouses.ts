import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export function useWarehouses() {
  return useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => (await api.get("/warehouses")).data.data
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
