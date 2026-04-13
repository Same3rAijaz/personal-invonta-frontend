import {
  Box, Chip, CircularProgress, Divider, Grid, Paper, Stack, Typography
} from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useBorrowProfitReport } from "../../hooks/useBorrows";
import PageHeader from "../../components/PageHeader";

const statusColor: Record<string, "default" | "warning" | "info" | "success" | "error"> = {
  PENDING: "warning",
  APPROVED: "info",
  ACTIVE: "success",
  PARTIALLY_RETURNED: "info",
  FULLY_RETURNED: "default",
  REJECTED: "error",
  CANCELLED: "error"
};

export default function BorrowProfitReport() {
  const { data, isLoading } = useBorrowProfitReport();
  const navigate = useNavigate();

  if (isLoading) return <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <PageHeader title="Borrow Profit Report" />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)", textAlign: "center" }}>
            {/* BUG-20: Clarified label — total includes both lender and borrower roles */}
            <Typography variant="overline" color="text.secondary">Total Profit (Lending Activity)</Typography>
            <Typography variant="h4" fontWeight={800} color="success.main" sx={{ mt: 0.5 }}>
              {(data?.totalProfit || 0).toFixed(2)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)", textAlign: "center" }}>
            <Typography variant="overline" color="text.secondary">Active Borrow Orders (as Borrower)</Typography>
            <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
              {(data?.borrowOrders || []).filter((b: any) => b.status === "ACTIVE").length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)", textAlign: "center" }}>
            <Typography variant="overline" color="text.secondary">Total Settlement Due (You Owe as Borrower)</Typography>
            <Typography variant="h4" fontWeight={800} color="error.main" sx={{ mt: 0.5 }}>
              {(data?.borrowOrders || []).reduce((s: number, b: any) => s + (b.totalSettlementDue || 0), 0).toFixed(2)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* BUG-20: Clearly labelled as "as Borrower" */}
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Borrowed Stock Orders (as Borrower)</Typography>
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)", mb: 4 }}>
        {(data?.borrowOrders || []).length === 0 ? (
          <Typography color="text.secondary">No borrow orders found.</Typography>
        ) : (
          (data?.borrowOrders || []).map((bo: any) => (
            <Box
              key={bo._id}
              sx={{ py: 1.5, borderBottom: "1px solid rgba(0,0,0,0.06)", cursor: "pointer", "&:hover": { bgcolor: "rgba(14,165,233,0.04)" }, px: 1, borderRadius: 1 }}
              onClick={() => navigate(`/borrows/${bo._id}`)}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography fontWeight={600}>{bo.number}</Typography>
                  <Chip label={bo.status} size="small" color={statusColor[bo.status] || "default"} />
                </Stack>
                <Stack direction="row" spacing={3} alignItems="center">
                  <Box textAlign="right">
                    <Typography variant="caption" color="text.secondary">Settlement Due</Typography>
                    <Typography fontWeight={700} color="error.main">{(bo.totalSettlementDue || 0).toFixed(2)}</Typography>
                  </Box>
                </Stack>
              </Stack>
            </Box>
          ))
        )}
      </Paper>

      {/* BUG-20: Labelled clearly as "as Lender" */}
      {(data?.profitByBorrowOrder || []).length > 0 && (
        <>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Profit Earned per Loan (as Lender)</Typography>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
            {data.profitByBorrowOrder.map((entry: any) => (
              <Box
                key={entry._id}
                sx={{ py: 1.5, borderBottom: "1px solid rgba(0,0,0,0.06)", cursor: "pointer", "&:hover": { bgcolor: "rgba(14,165,233,0.04)" }, px: 1, borderRadius: 1 }}
                onClick={() => navigate(`/borrows/${entry._id}`)}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  {/* BUG-13: Show order number instead of raw ObjectId */}
                  <Typography fontWeight={600}>
                    {entry.orderNumber || entry._id}
                  </Typography>
                  <Stack direction="row" spacing={3}>
                    <Box textAlign="right">
                      <Typography variant="caption" color="text.secondary">Qty Sold</Typography>
                      <Typography fontWeight={600}>{entry.totalQty}</Typography>
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="caption" color="text.secondary">Profit</Typography>
                      <Typography fontWeight={700} color="success.main">{(entry.totalProfit || 0).toFixed(2)}</Typography>
                    </Box>
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Paper>
        </>
      )}
    </Box>
  );
}
