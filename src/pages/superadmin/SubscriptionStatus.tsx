import { Box, Chip, InputAdornment, Typography } from "@mui/material";
import TextField from "../../components/CustomTextField";
import SearchIcon from "@mui/icons-material/Search";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { useState } from "react";
import DataTable from "../../components/DataTable";

export default function SubscriptionStatus() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["superadmin-subscription-status", page, rowsPerPage, search],
    queryFn: async () => {
      const params: any = { page: page + 1, limit: rowsPerPage };
      if (search) params.search = search;
      return (await api.get("/superadmin/subscriptions/business-status", { params })).data.data;
    }
  });

  const items = data?.items || [];
  const total = data?.total || 0;

  const paymentChip = (status: string) => {
    const map: Record<string, { color: "success" | "error" | "warning" | "default"; label: string }> = {
      paid: { color: "success", label: "Paid" },
      failed: { color: "error", label: "Failed" },
      pending: { color: "warning", label: "Pending" },
      none: { color: "default", label: "No Payment Yet" }
    };
    const cfg = map[status] || { color: "default" as const, label: status };
    return <Chip size="small" color={cfg.color} label={cfg.label} />;
  };

  const subscriptionChip = (status: string) => {
    const map: Record<string, { color: "success" | "error" | "warning" | "default"; label: string }> = {
      active: { color: "success", label: "Active" },
      pending: { color: "warning", label: "Pending" },
      past_due: { color: "error", label: "Past Due" },
      cancelled: { color: "default", label: "Cancelled" },
      paused: { color: "default", label: "Paused" }
    };
    const cfg = map[status] || { color: "default" as const, label: status };
    return <Chip size="small" color={cfg.color} label={cfg.label} />;
  };

  return (
    <Box>
      <DataTable
        title="Business Subscription Status"
        subtitle="Latest payment and subscription state by business"
        columns={[
          {
            key: "businessName",
            label: "Business",
            render: (row: any) => (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.businessName}</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {row.contactPhone || "No phone"}
                </Typography>
              </Box>
            )
          },
          {
            key: "subscriptionStatus",
            label: "Subscription",
            render: (row: any) => subscriptionChip(String(row.subscriptionStatus || "pending"))
          },
          {
            key: "lastPaymentStatus",
            label: "Last Payment",
            render: (row: any) => paymentChip(String(row.lastPaymentStatus || "none"))
          },
          {
            key: "lastAmount",
            label: "Last Amount",
            render: (row: any) =>
              row.lastAmount ? `${row.lastCurrency || "PKR"} ${Number(row.lastAmount).toLocaleString()}` : "—"
          },
          {
            key: "lastTransactionAt",
            label: "Last Transaction",
            render: (row: any) => (row.lastTransactionAt ? new Date(row.lastTransactionAt).toLocaleString() : "—")
          },
          {
            key: "lastPaidAt",
            label: "Last Paid At",
            render: (row: any) => (row.lastPaidAt ? new Date(row.lastPaidAt).toLocaleString() : "—")
          },
          {
            key: "lastFailureReason",
            label: "Failure Reason",
            render: (row: any) => row.lastFailureReason || "—"
          }
        ]}
        rows={items}
        loading={isLoading}
        actions={
          <TextField
            size="small"
            placeholder="Search by business name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
            sx={{ minWidth: 280 }}
          />
        }
        page={page}
        rowsPerPage={rowsPerPage}
        total={total}
        onPageChange={setPage}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value);
          setPage(0);
        }}
      />
    </Box>
  );
}
