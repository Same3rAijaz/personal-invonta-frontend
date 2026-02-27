import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export function useInventoryBalances(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ["inventory", "balances", params?.page, params?.limit, params?.search],
    queryFn: async () => (await api.get("/inventory/balances", { params })).data.data
  });
}

export function useInventoryLedger(params?: { productId?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["inventory", "ledger", params?.productId, params?.page, params?.limit],
    queryFn: async () => (await api.get("/inventory/ledger", { params })).data.data
  });
}
