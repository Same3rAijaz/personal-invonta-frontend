import { useQuery } from "@tanstack/react-query";
import { listCities, listCountries, listStates } from "../api/geo";
import { STATIC_STALE_TIME } from "../config/queryDefaults";

export function useCountries() {
  return useQuery({
    queryKey: ["geo-countries"],
    queryFn: listCountries,
    staleTime: STATIC_STALE_TIME,
    gcTime: STATIC_STALE_TIME,
  });
}

export function useStates(country?: string) {
  return useQuery({
    queryKey: ["geo-states", country],
    queryFn: () => listStates(country),
    enabled: Boolean(country),
    staleTime: STATIC_STALE_TIME,
    gcTime: STATIC_STALE_TIME,
  });
}

export function useCities(country?: string, state?: string) {
  return useQuery({
    queryKey: ["geo-cities", country, state],
    queryFn: () => listCities(country, state),
    enabled: Boolean(country && state),
    staleTime: STATIC_STALE_TIME,
    gcTime: STATIC_STALE_TIME,
  });
}
