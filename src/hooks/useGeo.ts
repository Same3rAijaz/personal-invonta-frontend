import { useQuery } from "@tanstack/react-query";
import { listCities, listCountries, listStates } from "../api/geo";

export function useCountries() {
  return useQuery({
    queryKey: ["geo-countries"],
    queryFn: listCountries
  });
}

export function useStates(country?: string) {
  return useQuery({
    queryKey: ["geo-states", country],
    queryFn: () => listStates(country),
    enabled: Boolean(country)
  });
}

export function useCities(country?: string, state?: string) {
  return useQuery({
    queryKey: ["geo-cities", country, state],
    queryFn: () => listCities(country, state),
    enabled: Boolean(country && state)
  });
}
