import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export function useLocations(params?: { warehouseId?: string; page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ["locations", params?.warehouseId, params?.page, params?.limit, params?.search],
    queryFn: async () => (await api.get("/locations", { params })).data.data
  });
}

export function useCreateLocation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => (await api.post("/locations", payload)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["locations"] })
  });
}

export function useUpdateLocation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) =>
      (await api.patch(`/locations/${id}`, payload)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["locations"] })
  });
}

export function useDeleteLocation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/locations/${id}`)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["locations"] })
  });
}
