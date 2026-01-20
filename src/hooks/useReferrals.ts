import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export function useReferralSettings() {
  return useQuery({
    queryKey: ["referrals", "settings"],
    queryFn: async () => (await api.get("/referrals/settings")).data.data
  });
}

export function useUpdateReferralSettings() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { percent: number }) => (await api.patch("/referrals/settings", payload)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["referrals", "settings"] })
  });
}

export function useMyReferrals() {
  return useQuery({
    queryKey: ["referrals", "my"],
    queryFn: async () => (await api.get("/referrals/my")).data.data
  });
}
