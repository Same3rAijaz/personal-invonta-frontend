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
  Legend
} from "recharts";
import { useReceivablesReport } from "../hooks/useUdhaar";

const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const integerFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const formatValue = (value: number | null | undefined, compact = false) => {
  if (value === null || value === undefined) return "-";
  return compact
    ? new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value)
    : integerFormat.format(value);
};

export default function Dashboard() {
  const reports = useReports();
  const receivables = useReceivablesReport({});

  const stockRows = (reports.stockOnHand.data || []).slice(0, 8).map((row: any, idx: number) => ({
    name: row.productId?.slice(-6) || `P${idx + 1}`,
    qty: row.qty
  }));

  const lowStockCount = reports.lowStock.data?.length || 0;
  const totalProducts = reports.stockOnHand.data?.length || 0;

  const stockHealth = [
    {
      name: "Items",
      low: lowStockCount,
      healthy: Math.max(0, totalProducts - lowStockCount)
    }
  ];

  const orderSummary = [
    { name: "Purchases", total: reports.purchaseSummary.data?.total || 0 },
    { name: "Sales", total: reports.salesSummary.data?.total || 0 }
  ];

  const stats = [
    { label: "Inventory Valuation", value: formatValue(reports.valuation.data?.totalValue, true) },
    { label: "Total Products", value: formatValue(totalProducts) },
    { label: "Low Stock Items", value: formatValue(lowStockCount) },
    { label: "Sales Orders", value: formatValue(reports.salesSummary.data?.total) },
    { label: "Purchase Orders", value: formatValue(reports.purchaseSummary.data?.total) },
    { label: "Attendance Hours", value: numberFormat.format(reports.attendance.data?.totalHours ?? 0) },
    { label: "Profit (All Time)", value: formatValue(reports.profit.data?.totalProfit, true) }
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
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2.5, borderRadius: 2, boxShadow: "0 14px 30px rgba(15,23,42,0.08)" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Stock On Hand</Typography>
              <Typography variant="caption" color="text.secondary">Top items by quantity</Typography>
            </Stack>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stockRows} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.35)" />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="qty" fill="#0ea5e9" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2.5, borderRadius: 2, boxShadow: "0 14px 30px rgba(15,23,42,0.08)" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Stock Health</Typography>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stockHealth} layout="vertical" barSize={26}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.35)" />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="healthy" stackId="a" fill="#22c55e" name="Healthy Stock" radius={[2, 2, 2, 2]} />
                <Bar dataKey="low" stackId="a" fill="#f97316" name="Low Stock" radius={[2, 2, 2, 2]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2.5, borderRadius: 2, boxShadow: "0 14px 30px rgba(15,23,42,0.08)" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Orders Summary</Typography>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={orderSummary} barGap={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.35)" />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="total" fill="#f97316" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
