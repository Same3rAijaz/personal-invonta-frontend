import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export function useCustomers(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ["customers", params?.page, params?.limit, params?.search],
    queryFn: async () => (await api.get("/customers", { params })).data.data
  });
}

export function useCreateCustomer() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => (await api.post("/customers", payload)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["customers"] })
  });
}

export function useUpdateCustomer() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) =>
      (await api.patch(`/customers/${id}`, payload)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["customers"] })
  });
}

export function useDeleteCustomer() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/customers/${id}`)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["customers"] })
  });
}
