import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export function useEmployees(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ["employees", params?.page, params?.limit, params?.search],
    queryFn: async () => {
      if (params?.search) {
        return (
          await api.get("/employees/semantic-search", {
            params: { query: params.search, limit: params.limit }
          })
        ).data.data;
      }
      return (await api.get("/employees", { params })).data.data;
    }
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

export function useResetEmployeePassword() {
  return useMutation({
    mutationFn: async ({ id, password }: { id: string; password?: string }) =>
      (await api.patch(`/employees/${id}/reset-password`, { password })).data.data
  });
}
