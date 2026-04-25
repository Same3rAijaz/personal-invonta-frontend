import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export function useAttendance(params?: { employeeId?: string; page?: number; limit?: number; search?: string; enabled?: boolean }) {
  const { enabled = true, ...queryParams } = params || {};
  return useQuery({
    queryKey: ["attendance", queryParams.employeeId, queryParams.page, queryParams.limit, queryParams.search],
    enabled,
    queryFn: async () => (await api.get("/attendance", { params: queryParams })).data.data
  });
}

export function useCheckIn() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => (await api.post("/attendance/check-in", payload)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["attendance"] })
  });
}

export function useCheckOut() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => (await api.post("/attendance/check-out", payload)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["attendance"] })
  });
}

export function useAttendanceEntry(id?: string) {
  return useQuery({
    queryKey: ["attendance-entry", id],
    enabled: Boolean(id),
    queryFn: async () => (await api.get(`/attendance/${id}`)).data.data
  });
}

export function useCreateManualAttendance() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => (await api.post("/attendance/manual", payload)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["attendance"] })
  });
}

export function useUpdateAttendance() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) =>
      (await api.patch(`/attendance/${id}`, payload)).data.data,
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["attendance"] });
      client.invalidateQueries({ queryKey: ["attendance-entry", variables.id] });
    }
  });
}
