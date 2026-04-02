import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export function useShopFriends() {
  return useQuery({
    queryKey: ["shop-friends"],
    queryFn: async () => (await api.get("/shop-friends")).data.data
  });
}

export function useShopFriendRequests() {
  return useQuery({
    queryKey: ["shop-friends", "requests"],
    queryFn: async () => (await api.get("/shop-friends/requests")).data.data
  });
}

export function useSendFriendRequest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (targetBusinessId: string) =>
      (await api.post("/shop-friends/request", { targetBusinessId })).data.data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["shop-friends"] });
    }
  });
}

export function useAcceptFriendRequest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) =>
      (await api.post(`/shop-friends/${requestId}/accept`)).data.data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["shop-friends"] });
    }
  });
}

export function useDeclineFriendRequest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) =>
      (await api.post(`/shop-friends/${requestId}/decline`)).data.data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["shop-friends"] });
    }
  });
}

export function useRemoveFriend() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (friendId: string) =>
      (await api.delete(`/shop-friends/${friendId}`)).data.data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["shop-friends"] });
    }
  });
}

export function useMyLendableProducts() {
  return useQuery({
    queryKey: ["shop-friends", "my-lendable-products"],
    queryFn: async () =>
      (await api.get("/shop-friends/my-lendable-products")).data.data
  });
}

export function useShopDiscover(search?: string) {
  return useQuery({
    queryKey: ["shop-discover", search],
    queryFn: async () =>
      (await api.get("/businesses/discover", { params: { search, limit: 50 } })).data.data,
    staleTime: 30_000
  });
}

export function useFriendProducts(friendBusinessId: string | null) {
  return useQuery({
    queryKey: ["shop-friends", friendBusinessId, "products"],
    queryFn: async () =>
      (await api.get(`/shop-friends/${friendBusinessId}/products`)).data.data,
    enabled: !!friendBusinessId
  });
}
