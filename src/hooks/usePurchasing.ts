import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export function usePurchaseOrders() {
  return useQuery({
    queryKey: ["pos"],
    queryFn: async () => (await api.get("/purchasing/pos")).data.data
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
