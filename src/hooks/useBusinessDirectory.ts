import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export function useBusinessDirectory(search?: string) {
  return useQuery({
    queryKey: ["business-directory", search],
    queryFn: async () => (await api.get("/businesses/directory", { params: { search, limit: 200 } })).data.data,
    staleTime: 60_000
  });
}
