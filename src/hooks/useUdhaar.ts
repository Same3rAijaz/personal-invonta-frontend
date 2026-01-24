import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  agingReport,
  createEntry,
  createParty,
  getParty,
  getStatement,
  listEntries,
  listParties,
  receivablesReport,
  reverseEntry,
  sendReminder,
  updateParty,
  voidEntry
} from "../api/udhaar";

export function useParties(params: any) {
  return useQuery({
    queryKey: ["udhaar-parties", params],
    queryFn: () => listParties(params)
  });
}

export function useParty(id: string) {
  return useQuery({
    queryKey: ["udhaar-party", id],
    queryFn: () => getParty(id),
    enabled: !!id
  });
}

export function useCreateParty() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => createParty(payload),
    onSuccess: () => client.invalidateQueries({ queryKey: ["udhaar-parties"] })
  });
}

export function useUpdateParty() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateParty(id, payload),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["udhaar-parties"] });
      client.invalidateQueries({ queryKey: ["udhaar-party", variables.id] });
    }
  });
}

export function useEntries(params: any) {
  return useQuery({
    queryKey: ["udhaar-entries", params],
    queryFn: () => listEntries(params)
  });
}

export function useCreateEntry() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, idempotencyKey }: { payload: any; idempotencyKey?: string }) => createEntry(payload, idempotencyKey),
    onSuccess: (_, variables) => {
      client.invalidateQueries({ queryKey: ["udhaar-entries"] });
      if (variables.payload?.partyId) {
        client.invalidateQueries({ queryKey: ["udhaar-party", variables.payload.partyId] });
      }
    }
  });
}

export function useVoidEntry() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => voidEntry(id, reason),
    onSuccess: () => client.invalidateQueries({ queryKey: ["udhaar-entries"] })
  });
}

export function useReverseEntry() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => reverseEntry(id, reason),
    onSuccess: () => client.invalidateQueries({ queryKey: ["udhaar-entries"] })
  });
}

export function useStatement(partyId: string, params: any) {
  return useQuery({
    queryKey: ["udhaar-statement", partyId, params],
    queryFn: () => getStatement(partyId, params),
    enabled: !!partyId
  });
}

export function useReceivablesReport(params: any) {
  return useQuery({
    queryKey: ["udhaar-receivables", params],
    queryFn: () => receivablesReport(params)
  });
}

export function useAgingReport(params: any) {
  return useQuery({
    queryKey: ["udhaar-aging", params],
    queryFn: () => agingReport(params)
  });
}

export function useSendReminder() {
  return useMutation({
    mutationFn: (payload: any) => sendReminder(payload)
  });
}
