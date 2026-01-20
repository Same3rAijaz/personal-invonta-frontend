import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export function useSalesOrders() {
  return useQuery({
    queryKey: ["sos"],
    queryFn: async () => (await api.get("/sales/sos")).data.data
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
