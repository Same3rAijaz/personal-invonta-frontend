import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export function useSalesReturns(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["sales-returns", params?.page, params?.limit],
    queryFn: async () => (await api.get("/sales/returns", { params })).data.data
  });
}

export function useSalesReturn(id: string) {
  return useQuery({
    queryKey: ["sales-returns", id],
    queryFn: async () => (await api.get(`/sales/returns/${id}`)).data.data,
    enabled: !!id
  });
}

export function useCreateSalesReturn() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => (await api.post("/sales/returns", payload)).data.data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["sales-returns"] });
      client.invalidateQueries({ queryKey: ["sos"] });
      client.invalidateQueries({ queryKey: ["inventory", "balances"] });
      client.invalidateQueries({ queryKey: ["borrows"] });
    }
  });
}
