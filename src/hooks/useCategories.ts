import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export function useCategories(params?: { page?: number; limit?: number; search?: string; activeOnly?: boolean }) {
  return useQuery({
    queryKey: ["categories", params?.page, params?.limit, params?.search, params?.activeOnly],
    queryFn: async () => {
      if (params?.search) {
        return (
          await api.get("/categories/semantic-search", {
            params: { query: params.search, limit: params.limit }
          })
        ).data.data;
      }
      return (await api.get("/categories", { params })).data.data;
    }
  });
}

export function useSuperAdminCategories(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ["superadmin-categories", params?.page, params?.limit, params?.search],
    queryFn: async () => (await api.get("/superadmin/categories", { params })).data.data
  });
}

export function useCreateCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => (await api.post("/superadmin/categories", payload)).data.data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["superadmin-categories"] });
      client.invalidateQueries({ queryKey: ["categories"] });
    }
  });
}

export function useUpdateCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) =>
      (await api.patch(`/superadmin/categories/${id}`, payload)).data.data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["superadmin-categories"] });
      client.invalidateQueries({ queryKey: ["categories"] });
    }
  });
}

export function useDeleteCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/superadmin/categories/${id}`)).data.data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["superadmin-categories"] });
      client.invalidateQueries({ queryKey: ["categories"] });
    }
  });
}
