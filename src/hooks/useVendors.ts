import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export function useVendors() {
  return useQuery({
    queryKey: ["vendors"],
    queryFn: async () => (await api.get("/vendors")).data.data
  });
}

export function useCreateVendor() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => (await api.post("/vendors", payload)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["vendors"] })
  });
}

export function useUpdateVendor() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) =>
      (await api.patch(`/vendors/${id}`, payload)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["vendors"] })
  });
}

export function useDeleteVendor() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/vendors/${id}`)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["vendors"] })
  });
}
