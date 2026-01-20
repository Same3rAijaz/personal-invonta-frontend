import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export function useReports() {
  return {
    stockOnHand: useQuery({ queryKey: ["reports", "stock"], queryFn: async () => (await api.get("/reports/stock-on-hand")).data.data }),
    lowStock: useQuery({ queryKey: ["reports", "low"], queryFn: async () => (await api.get("/reports/low-stock")).data.data }),
    valuation: useQuery({ queryKey: ["reports", "valuation"], queryFn: async () => (await api.get("/reports/inventory-valuation")).data.data }),
    attendance: useQuery({ queryKey: ["reports", "attendance"], queryFn: async () => (await api.get("/reports/attendance-summary")).data.data }),
    purchaseSummary: useQuery({ queryKey: ["reports", "purchase"], queryFn: async () => (await api.get("/reports/purchase-summary")).data.data }),
    salesSummary: useQuery({ queryKey: ["reports", "sales"], queryFn: async () => (await api.get("/reports/sales-summary")).data.data }),
    profit: useQuery({ queryKey: ["reports", "profit"], queryFn: async () => (await api.get("/reports/profit")).data.data })
  };
}
