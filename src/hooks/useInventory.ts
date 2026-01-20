import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export function useInventoryBalances() {
  return useQuery({
    queryKey: ["inventory", "balances"],
    queryFn: async () => (await api.get("/inventory/balances")).data.data
  });
}

export function useInventoryLedger(productId?: string) {
  return useQuery({
    queryKey: ["inventory", "ledger", productId],
    queryFn: async () => (await api.get("/inventory/ledger", { params: { productId } })).data.data
  });
}