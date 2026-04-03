import {
  Box,
  Grid,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import { useReports } from "../hooks/useReports";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import { SummaryCard } from "../components/SummaryCard";
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

import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import InventoryIcon from "@mui/icons-material/Inventory";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import StorefrontIcon from "@mui/icons-material/Storefront";
import BusinessIcon from "@mui/icons-material/Business";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import BlockIcon from "@mui/icons-material/Block";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import CancelIcon from "@mui/icons-material/Cancel";
import CategoryIcon from "@mui/icons-material/Category";

const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const integerFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const formatValue = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "-";
  return integerFormat.format(value);
};

// Chart Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Paper
        elevation={4}
        sx={{
          p: 1.5,
          borderRadius: 2,
          backgroundColor: "rgba(255, 255, 255, 0.97)",
          backdropFilter: "blur(8px)",
          border: "1px solid",
          borderColor: "divider"
        }}
      >
        <Typography variant="subtitle2" fontWeight={700} mb={1}>
          {label}
        </Typography>
        {payload.map((entry: any, index: number) => (
          <Stack key={index} direction="row" alignItems="center" spacing={1}>
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: entry.color }} />
            <Typography variant="body2" color="text.secondary">
              {entry.name}:{" "}
              <Typography component="span" fontWeight={600} color="text.primary">
                {entry.value}
              </Typography>
            </Typography>
          </Stack>
        ))}
      </Paper>
    );
  }
  return null;
};

function ShopDashboard({ udhaarEnabled }: { udhaarEnabled: boolean }) {
  const theme = useTheme();
  const reports = useReports();
  const receivables = useReceivablesReport({}, { enabled: udhaarEnabled });

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

  const inventoryValue = reports.valuation.data?.totalValue;
  const inventoryDisplay =
    inventoryValue === null || inventoryValue === undefined
      ? "-"
      : new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(inventoryValue);

  const profitValue = reports.profit.data?.totalProfit;
  const profitDisplay =
    profitValue === null || profitValue === undefined
      ? "-"
      : new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(profitValue);

  const receivableDisplay = udhaarEnabled
    ? new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(receivables.data?.dueTotal || 0)
    : "-";

  return (
    <Box>
      <PageHeader title="Overview Dashboard" />

      {/* Summary Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: { xs: 2.5, md: 3.5 } }}>
        {[
          { title: "Inventory Value", value: inventoryDisplay, icon: AttachMoneyIcon, color: "primary" as const },
          { title: "Low Stock", value: lowStockCount, icon: WarningAmberIcon, color: "error" as const },
          { title: "Sales Orders", value: reports.salesSummary.data?.total ?? 0, icon: ShoppingCartIcon, color: "info" as const },
          { title: "Total Products", value: totalProducts, icon: InventoryIcon, color: "secondary" as const },
          { title: "Total Profit", value: profitDisplay, icon: TrendingUpIcon, color: "success" as const },
          { title: "Receivables", value: receivableDisplay, icon: ReceiptLongIcon, color: "warning" as const },
        ].map((card) => (
          <Grid key={card.title} item xs={6} sm={4} md={4} lg={2}>
            <SummaryCard {...card} />
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
        <Grid item xs={12} md={7}>
          <Paper
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 2.5,
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "none",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>Stock On Hand</Typography>
                <Typography variant="body2" color="text.secondary">Top items by quantity</Typography>
              </Box>
            </Stack>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stockRows} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorQty" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.9} />
                    <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                <XAxis dataKey="name" tick={{ fill: theme.palette.text.secondary, fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill: theme.palette.text.secondary, fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: theme.palette.action.hover }} />
                <Bar dataKey="qty" fill="url(#colorQty)" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 2.5,
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "none",
              height: "100%",
            }}
          >
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5 }}>Stock Health Overview</Typography>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stockHealth} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.palette.divider} />
                <XAxis type="number" tick={{ fill: theme.palette.text.secondary, fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: theme.palette.text.secondary, fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: theme.palette.action.hover }} />
                <Legend wrapperStyle={{ paddingTop: "16px", fontSize: 12 }} />
                <Bar dataKey="healthy" stackId="a" fill={theme.palette.success.main} name="Healthy" radius={[4, 0, 0, 4]} barSize={28} />
                <Bar dataKey="low" stackId="a" fill={theme.palette.error.main} name="Low Stock" radius={[0, 4, 4, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 2.5,
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "none",
            }}
          >
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="h6" fontWeight={700}>Orders Summary</Typography>
              <Typography variant="body2" color="text.secondary">Comparison of your total sales vs purchases</Typography>
            </Box>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={orderSummary} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.secondary.main} stopOpacity={0.9} />
                    <stop offset="95%" stopColor={theme.palette.secondary.main} stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                <XAxis dataKey="name" tick={{ fill: theme.palette.text.secondary, fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill: theme.palette.text.secondary, fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: theme.palette.action.hover }} />
                <Bar dataKey="total" fill="url(#colorOrders)" radius={[4, 4, 0, 0]} maxBarSize={80} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

function SuperAdminDashboard() {
  const theme = useTheme();
  const markets = useQuery({
    queryKey: ["sa-dashboard-markets"],
    queryFn: async () => (await api.get("/superadmin/markets", { params: { page: 1, limit: 1000 } })).data.data
  });
  const businesses = useQuery({
    queryKey: ["sa-dashboard-businesses"],
    queryFn: async () => (await api.get("/superadmin/businesses", { params: { page: 1, limit: 1000 } })).data.data
  });
  const categories = useQuery({
    queryKey: ["sa-dashboard-categories"],
    queryFn: async () => (await api.get("/superadmin/categories", { params: { page: 1, limit: 1000 } })).data.data
  });
  const requests = useQuery({
    queryKey: ["sa-dashboard-requests"],
    queryFn: async () => (await api.get("/superadmin/requests", { params: { page: 1, limit: 1000 } })).data.data
  });

  const businessItems = businesses.data?.items || [];
  const requestItems = requests.data?.items || [];
  const pendingRequests = requestItems.filter((item: any) => item.status === "PENDING");
  const approvedRequests = requestItems.filter((item: any) => item.status === "APPROVED");
  const rejectedRequests = requestItems.filter((item: any) => item.status === "REJECTED");
  const activeBusinesses = businessItems.filter((item: any) => item.isActive && (!item.blockedUntil || new Date(item.blockedUntil) <= new Date()));
  const blockedBusinesses = businessItems.filter((item: any) => !item.isActive || (item.blockedUntil && new Date(item.blockedUntil) > new Date()));
  const recentRequests = [...requestItems]
    .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 8);

  return (
    <Box>
      <PageHeader title="Super Admin Dashboard" />

      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mb: { xs: 3, md: 4 } }}>
        {[
          { title: "Markets", value: formatValue(markets.data?.total || 0), icon: StorefrontIcon, color: "primary" as const },
          { title: "Businesses", value: formatValue(businesses.data?.total || 0), icon: BusinessIcon, color: "info" as const },
          { title: "Active Businesses", value: formatValue(activeBusinesses.length), icon: CheckCircleOutlineIcon, color: "success" as const },
          { title: "Blocked Businesses", value: formatValue(blockedBusinesses.length), icon: BlockIcon, color: "error" as const },
          { title: "Pending Requests", value: formatValue(pendingRequests.length), icon: PendingActionsIcon, color: "warning" as const },
          { title: "Approved Requests", value: formatValue(approvedRequests.length), icon: AssignmentTurnedInIcon, color: "success" as const },
          { title: "Rejected Requests", value: formatValue(rejectedRequests.length), icon: CancelIcon, color: "error" as const },
          { title: "Categories", value: formatValue(categories.data?.total || 0), icon: CategoryIcon, color: "secondary" as const },
        ].map((card) => (
          <Grid key={card.title} item xs={6} sm={6} md={3}>
            <SummaryCard {...card} />
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 0, borderRadius: 2.5, border: "1px solid", borderColor: "divider", overflow: "hidden", boxShadow: "none" }}>
        <DataTable
          title="Recent Shop Requests"
          subtitle={`${recentRequests.length} latest records`}
          columns={[
            { key: "businessName", label: "Business", render: (row: any) => <Typography fontWeight={600} variant="body2">{row.businessName || "-"}</Typography> },
            { key: "adminEmail", label: "Admin Email", render: (row: any) => row.adminEmail || "-" },
            {
              key: "status",
              label: "Status",
              render: (row: any) => (
                <Box component="span" sx={{
                  px: 1.5, py: 0.5, borderRadius: 2, fontSize: "0.75rem", fontWeight: 700,
                  bgcolor: row.status === "APPROVED" ? "success.light" : row.status === "REJECTED" ? "error.light" : "warning.light",
                  color: row.status === "APPROVED" ? "success.dark" : row.status === "REJECTED" ? "error.dark" : "warning.dark"
                }}>
                  {row.status || "-"}
                </Box>
              )
            },
            { key: "city", label: "City", render: (row: any) => row.city || "-" },
            {
              key: "createdAt",
              label: "Submitted",
              render: (row: any) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "-")
            }
          ]}
          rows={recentRequests}
          loading={requests.isLoading}
        />
      </Paper>
    </Box>
  );
}

export default function Dashboard() {
  const { user, business } = useAuth();
  const enabledModules = Array.isArray(business?.enabledModules) ? business.enabledModules.map((item: string) => String(item).toLowerCase()) : [];
  const udhaarEnabled = enabledModules.includes("udhaar");
  if (user?.role === "SUPER_ADMIN") {
    return <SuperAdminDashboard />;
  }
  return <ShopDashboard udhaarEnabled={udhaarEnabled} />;
}
