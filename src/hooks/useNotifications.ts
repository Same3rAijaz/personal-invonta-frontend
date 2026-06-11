import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { QUERY_STALE_TIME } from "../config/queryDefaults";

export function useNotifications(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["notifications", params?.page, params?.limit],
    staleTime: 30_000,
    refetchInterval: 60_000,
    queryFn: async () => (await api.get("/notifications", { params })).data.data
  });
}

export function useMarkNotificationRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.patch(`/notifications/${id}/read`)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["notifications"] })
  });
}
