import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export function usePurchaseOrders(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ["pos", params?.page, params?.limit, params?.search],
    queryFn: async () => (await api.get("/purchasing/pos", { params })).data.data
  });
}

export function useCreatePurchaseOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => (await api.post("/purchasing/pos", payload)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["pos"] })
  });
}

export function useUpdatePurchaseOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) =>
      (await api.patch(`/purchasing/pos/${id}`, payload)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["pos"] })
  });
}

export function useDeletePurchaseOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/purchasing/pos/${id}`)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["pos"] })
  });
}

export function useApprovePurchaseOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`/purchasing/pos/${id}/approve`)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["pos"] })
  });
}

export function useReceivePurchaseOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { warehouseId: string; locationId?: string } }) =>
      (await api.post(`/purchasing/pos/${id}/receive`, payload)).data.data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["pos"] });
      client.invalidateQueries({ queryKey: ["inventory", "balances"] });
      client.invalidateQueries({ queryKey: ["products"] });
    }
  });
}
