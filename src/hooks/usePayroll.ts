import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export function usePayrollRuns(params?: { page?: number; limit?: number; month?: string; status?: string }) {
  return useQuery({
    queryKey: ["payroll-runs", params?.page, params?.limit, params?.month, params?.status],
    queryFn: async () => (await api.get("/payroll/runs", { params })).data.data
  });
}

export function usePayrollPreview() {
  return useMutation({
    mutationFn: async (month: string) => (await api.post("/payroll/preview", { month })).data.data
  });
}

export function useCreatePayrollRun() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { month: string; overwrite?: boolean }) => (await api.post("/payroll/runs", payload)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["payroll-runs"] })
  });
}

export function useFinalizePayrollRun() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.patch(`/payroll/runs/${id}/finalize`)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["payroll-runs"] })
  });
}

export function useMarkPayrollPaid() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.patch(`/payroll/runs/${id}/paid`)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["payroll-runs"] })
  });
}
