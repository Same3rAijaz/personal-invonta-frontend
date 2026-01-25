import { Box, Grid, Paper, Stack, Typography } from "@mui/material";
import { useReports } from "../hooks/useReports";
import PageHeader from "../components/PageHeader";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useReceivablesReport } from "../hooks/useUdhaar";

const palette = ["#0ea5e9", "#f97316", "#22c55e", "#e11d48", "#a855f7", "#14b8a6"];

export default function Dashboard() {
  const reports = useReports();
  const receivables = useReceivablesReport({});

  const stockRows = (reports.stockOnHand.data || []).slice(0, 8).map((row: any, idx: number) => ({
    name: row.productId?.slice(-6) || `P${idx + 1}`,
    qty: row.qty
  }));

  const lowStockCount = reports.lowStock.data?.length || 0;
  const totalProducts = reports.stockOnHand.data?.length || 0;

  const stockPie = [
    { name: "Low Stock", value: lowStockCount },
    { name: "Healthy Stock", value: Math.max(0, totalProducts - lowStockCount) }
  ];

  const orderSummary = [
    { name: "Purchases", total: reports.purchaseSummary.data?.total || 0 },
    { name: "Sales", total: reports.salesSummary.data?.total || 0 }
  ];

  return (
    <Box>
      <PageHeader title="Dashboard" />
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, borderRadius: 3, boxShadow: "0 10px 24px rgba(15,23,42,0.08)" }}>
            <Typography variant="subtitle2">Inventory Valuation</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {reports.valuation.data?.totalValue ?? "-"}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, borderRadius: 3, boxShadow: "0 10px 24px rgba(15,23,42,0.08)" }}>
            <Typography variant="subtitle2">Low Stock Items</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {lowStockCount}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, borderRadius: 3, boxShadow: "0 10px 24px rgba(15,23,42,0.08)" }}>
            <Typography variant="subtitle2">Sales Orders</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {reports.salesSummary.data?.total ?? 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, borderRadius: 3, boxShadow: "0 10px 24px rgba(15,23,42,0.08)" }}>
            <Typography variant="subtitle2">Attendance Hours</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {reports.attendance.data?.totalHours ?? 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, borderRadius: 3, boxShadow: "0 10px 24px rgba(15,23,42,0.08)" }}>
            <Typography variant="subtitle2">Profit (All Time)</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {reports.profit.data?.totalProfit ?? 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, borderRadius: 3, boxShadow: "0 10px 24px rgba(15,23,42,0.08)" }}>
            <Typography variant="subtitle2">Udhaar Receivable</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {receivables.data?.totalReceivable ?? 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, borderRadius: 3, boxShadow: "0 10px 24px rgba(15,23,42,0.08)" }}>
            <Typography variant="subtitle2">Udhaar Payable</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {receivables.data?.totalPayable ?? 0}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2.5, borderRadius: 3, boxShadow: "0 14px 30px rgba(15,23,42,0.08)" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Stock On Hand</Typography>
              <Typography variant="caption" color="text.secondary">Top items</Typography>
            </Stack>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stockRows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="qty" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2.5, borderRadius: 3, boxShadow: "0 14px 30px rgba(15,23,42,0.08)" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Stock Health</Typography>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={stockPie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                  {stockPie.map((_, idx) => (
                    <Cell key={idx} fill={palette[idx % palette.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2.5, borderRadius: 3, boxShadow: "0 14px 30px rgba(15,23,42,0.08)" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Orders Summary</Typography>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={orderSummary}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
