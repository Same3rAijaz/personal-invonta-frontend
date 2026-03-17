import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export function useSalesOrders(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ["sos", params?.page, params?.limit, params?.search],
    queryFn: async () => (await api.get("/sales/sos", { params })).data.data
  });
}

export function useCreateSalesOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => (await api.post("/sales/sos", payload)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["sos"] })
  });
}

export function useUpdateSalesOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) =>
      (await api.patch(`/sales/sos/${id}`, payload)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["sos"] })
  });
}

export function useDeleteSalesOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/sales/sos/${id}`)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["sos"] })
  });
}

export function useConfirmSalesOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`/sales/sos/${id}/confirm`)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["sos"] })
  });
}

export function useShipSalesOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { warehouseId: string; locationId?: string } }) =>
      (await api.post(`/sales/sos/${id}/ship`, payload)).data.data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["sos"] });
      client.invalidateQueries({ queryKey: ["inventory", "balances"] });
      client.invalidateQueries({ queryKey: ["products"] });
    }
  });
}
