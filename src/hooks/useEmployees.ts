import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async () => (await api.get("/employees")).data.data
  });
}

export function useCreateEmployee() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => (await api.post("/employees", payload)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["employees"] })
  });
}

export function useUpdateEmployee() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) =>
      (await api.patch(`/employees/${id}`, payload)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["employees"] })
  });
}

export function useDeleteEmployee() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/employees/${id}`)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["employees"] })
  });
}
