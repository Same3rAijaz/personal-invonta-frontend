import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { QUERY_STALE_TIME } from "../config/queryDefaults";

export function useReports() {
  const reportOptions = {
    staleTime: QUERY_STALE_TIME * 2,
    refetchOnWindowFocus: false as const,
  };
  return {
    stockOnHand: useQuery({ queryKey: ["reports", "stock"], queryFn: async () => (await api.get("/reports/stock-on-hand")).data.data, ...reportOptions }),
    lowStock: useQuery({ queryKey: ["reports", "low"], queryFn: async () => (await api.get("/reports/low-stock")).data.data, ...reportOptions }),
    valuation: useQuery({ queryKey: ["reports", "valuation"], queryFn: async () => (await api.get("/reports/inventory-valuation")).data.data, ...reportOptions }),
    attendance: useQuery({ queryKey: ["reports", "attendance"], queryFn: async () => (await api.get("/reports/attendance-summary")).data.data, ...reportOptions }),
    purchaseSummary: useQuery({ queryKey: ["reports", "purchase"], queryFn: async () => (await api.get("/reports/purchase-summary")).data.data, ...reportOptions }),
    salesSummary: useQuery({ queryKey: ["reports", "sales"], queryFn: async () => (await api.get("/reports/sales-summary")).data.data, ...reportOptions }),
    profit: useQuery({ queryKey: ["reports", "profit"], queryFn: async () => (await api.get("/reports/profit")).data.data, ...reportOptions })
  };
}
