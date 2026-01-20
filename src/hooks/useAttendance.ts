import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export function useAttendance(employeeId?: string) {
  return useQuery({
    queryKey: ["attendance", employeeId],
    queryFn: async () => (await api.get("/attendance", { params: { employeeId } })).data.data
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