import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export function useBorrowOrders(params?: { page?: number; limit?: number; role?: "borrower" | "lender" }) {
  return useQuery({
    queryKey: ["borrows", params?.page, params?.limit, params?.role],
    queryFn: async () => (await api.get("/borrows", { params })).data.data
  });
}

export function useBorrowOrder(id: string) {
  return useQuery({
    queryKey: ["borrows", id],
    queryFn: async () => (await api.get(`/borrows/${id}`)).data.data,
    enabled: !!id
  });
}

export function useCreateBorrowOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => (await api.post("/borrows", payload)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["borrows"] })
  });
}

export function useApproveBorrowOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { items: { productId: string; lenderWarehouseId: string }[] } }) =>
      (await api.post(`/borrows/${id}/approve`, payload)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["borrows"] })
  });
}

export function useRejectBorrowOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`/borrows/${id}/reject`)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["borrows"] })
  });
}

export function useActivateBorrowOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`/borrows/${id}/activate`)).data.data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["borrows"] });
      client.invalidateQueries({ queryKey: ["inventory", "balances"] });
    }
  });
}

export function useReturnBorrowOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) =>
      (await api.post(`/borrows/${id}/return`, payload)).data.data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["borrows"] });
      client.invalidateQueries({ queryKey: ["inventory", "balances"] });
    }
  });
}

// BUG-17: Cancel mutation — borrower cancels their own PENDING order
export function useCancelBorrowOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`/borrows/${id}/cancel`)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["borrows"] })
  });
}

export function useBorrowProfitSummary(id: string) {
  return useQuery({
    queryKey: ["borrows", id, "profit"],
    queryFn: async () => (await api.get(`/borrows/${id}/profit-summary`)).data.data,
    enabled: !!id
  });
}

export function useBorrowProfitReport() {
  return useQuery({
    queryKey: ["borrows", "profit-report"],
    queryFn: async () => (await api.get("/borrows/profit-report")).data.data
  });
}
