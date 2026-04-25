import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

type LeaveQueryParams = {
  employeeId?: string;
  leaveType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  enabled?: boolean;
};

export function useLeaves(params?: LeaveQueryParams) {
  const { enabled = true, ...queryParams } = params || {};
  return useQuery({
    queryKey: [
      "leaves",
      queryParams.employeeId,
      queryParams.leaveType,
      queryParams.status,
      queryParams.startDate,
      queryParams.endDate,
      queryParams.search,
      queryParams.page,
      queryParams.limit
    ],
    enabled,
    queryFn: async () => (await api.get("/leaves", { params: queryParams })).data.data
  });
}

export function useCreateLeaveRequest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => (await api.post("/leaves", payload)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["leaves"] })
  });
}

export function useApproveLeaveRequest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload?: any }) =>
      (await api.patch(`/leaves/${id}/approve`, payload || {})).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["leaves"] })
  });
}

export function useRejectLeaveRequest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload?: any }) =>
      (await api.patch(`/leaves/${id}/reject`, payload || {})).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["leaves"] })
  });
}

export function useCancelLeaveRequest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.patch(`/leaves/${id}/cancel`)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["leaves"] })
  });
}
