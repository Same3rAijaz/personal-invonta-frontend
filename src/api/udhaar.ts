import { api } from "./client";

export async function listParties(params: any) {
  const { data } = await api.get("/udhaar/parties", { params });
  return data.data;
}

export async function getParty(id: string) {
  const { data } = await api.get(`/udhaar/parties/${id}`);
  return data.data;
}

export async function createParty(payload: any) {
  const { data } = await api.post("/udhaar/parties", payload);
  return data.data;
}

export async function updateParty(id: string, payload: any) {
  const { data } = await api.patch(`/udhaar/parties/${id}`, payload);
  return data.data;
}

export async function archiveParty(id: string) {
  const { data } = await api.post(`/udhaar/parties/${id}/archive`);
  return data.data;
}

export async function mergeParty(targetId: string, sourcePartyId: string) {
  const { data } = await api.post(`/udhaar/parties/${targetId}/merge`, { sourcePartyId });
  return data.data;
}

export async function listEntries(params: any) {
  const { data } = await api.get("/udhaar/entries", { params });
  return data.data;
}

export async function createEntry(payload: any, idempotencyKey?: string) {
  const headers = idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined;
  const { data } = await api.post("/udhaar/entries", payload, { headers });
  return data.data;
}

export async function voidEntry(id: string, reason: string) {
  const { data } = await api.post(`/udhaar/entries/${id}/void`, { reason });
  return data.data;
}

export async function reverseEntry(id: string, reason: string) {
  const { data } = await api.post(`/udhaar/entries/${id}/reverse`, { reason });
  return data.data;
}

export async function getStatement(partyId: string, params: any) {
  const { data } = await api.get(`/udhaar/entries/party/${partyId}/statement`, { params });
  return data.data;
}

export async function receivablesReport(params: any) {
  const { data } = await api.get("/udhaar/reports/receivables", { params });
  return data.data;
}

export async function agingReport(params: any) {
  const { data } = await api.get("/udhaar/reports/aging", { params });
  return data.data;
}

export async function sendReminder(payload: any) {
  const { data } = await api.post("/udhaar/reminders/send", payload);
  return data.data;
}
