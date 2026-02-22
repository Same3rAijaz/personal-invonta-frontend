import { api } from "./client";

export async function listCountries() {
  const { data } = await api.get("/public/geo/countries");
  return data.data;
}

export async function listStates(country?: string) {
  const { data } = await api.get("/public/geo/states", { params: { country } });
  return data.data;
}

export async function listCities(country?: string, state?: string) {
  const { data } = await api.get("/public/geo/cities", { params: { country, state } });
  return data.data;
}
