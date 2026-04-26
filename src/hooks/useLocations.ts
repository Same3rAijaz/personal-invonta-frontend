import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export function useLocations(params?: { page?: number; limit?: number; search?: string; warehouseId?: string }) {
  return useQuery({
    queryKey: ["locations", params?.page, params?.limit, params?.search, params?.warehouseId],
    queryFn: async () => {
      return (await api.get("/locations", { params })).data.data;
    },
    enabled: true
  });
}

export function useLocationsByWarehouse(warehouseId?: string) {
  return useQuery({
    queryKey: ["locations", "by-warehouse", warehouseId],
    queryFn: async () => {
      if (!warehouseId) return { items: [] };
      return (await api.get(`/locations/by-warehouse/${warehouseId}`)).data.data;
    },
    enabled: !!warehouseId
  });
}

export function useLocationHierarchy(warehouseId?: string) {
  return useQuery({
    queryKey: ["locations", "hierarchy", warehouseId],
    queryFn: async () => {
      if (!warehouseId) return { items: [], all: [] };
      return (await api.get(`/locations/hierarchy/${warehouseId}`)).data.data;
    },
    enabled: !!warehouseId
  });
}

export function useParentLocationOptions(warehouseId?: string, excludeId?: string) {
  return useQuery({
    queryKey: ["locations", "parent-options", warehouseId, excludeId],
    queryFn: async () => {
      if (!warehouseId) return { items: [] };
      return (await api.get(`/locations/parent-options/${warehouseId}`, { params: { excludeId } })).data.data;
    },
    enabled: !!warehouseId
  });
}

export function useCreateLocation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => (await api.post("/locations", payload)).data.data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["locations"] });
    }
  });
}

export function useUpdateLocation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) =>
      (await api.patch(`/locations/${id}`, payload)).data.data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["locations"] });
    }
  });
}

export function useDeleteLocation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/locations/${id}`)).data.data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["locations"] });
    }
  });
}
