import React from "react";
import { Box, Typography, Grid, Paper, Stack, useTheme, SvgIconProps } from "@mui/material";
import { useReports } from "../../hooks/useReports";
import { useProducts } from "../../hooks/useProducts";
import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts";
import InventoryOutlined from "@mui/icons-material/InventoryOutlined";
import AddShoppingCartOutlinedIcon from "@mui/icons-material/AddShoppingCartOutlined";
import AttachMoneyOutlinedIcon from "@mui/icons-material/AttachMoneyOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType<SvgIconProps>;
  color: "primary" | "secondary" | "success" | "error" | "warning" | "info";
}

function SummaryCard({ title, value, icon: Icon, color }: SummaryCardProps) {
  const theme = useTheme();
  const themeColor = theme.palette[color].main;
  const lightColor = `${themeColor}20`; // small opacity

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        transition: "all 0.3s ease",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 12px 24px -10px ${themeColor}60`,
          borderColor: themeColor
        }
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {title}
        </Typography>
        <Box
          sx={{
            backgroundColor: lightColor,
            color: themeColor,
            borderRadius: 2,
            width: 48,
            height: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Icon />
        </Box>
      </Stack>
      <Typography variant="h4" fontWeight={800} color="text.primary">
        {value}
      </Typography>
    </Paper>
  );
}

export default function Reports() {
  const reports = useReports();
  const { data: productsData } = useProducts({ page: 1, limit: 1000 });

  const stockData = React.useMemo(() => {
    return (reports.stockOnHand.data || []).map((s: any) => ({
      ...s,
      productName: productsData?.items?.find((p: any) => p._id === s.productId)?.name || s.productId
    }));
  }, [reports.stockOnHand.data, productsData]);

  const totalStock = stockData.reduce((acc: number, item: any) => acc + (item.qty || 0), 0);
  const lowStockCount = reports.lowStock.data?.length || 0;
  const valuationTotal = reports.valuation.data?.totalValue || 0;
  
  const salesHistoryCount = reports.salesSummary.data?.total || 0;

  return (
    <Box>
      <PageHeader title="Analytics & Reports" />

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mt: 1, mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard 
            title="Total Stock Qty" 
            value={reports.stockOnHand.isLoading ? "..." : totalStock} 
            icon={InventoryOutlined} 
            color="primary" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard 
            title="Low Stock Items" 
            value={reports.lowStock.isLoading ? "..." : lowStockCount} 
            icon={ErrorOutlineOutlinedIcon} 
            color="error" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard 
            title="Est. Inventory Value" 
            value={reports.valuation.isLoading ? "..." : `$${valuationTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
            icon={AttachMoneyOutlinedIcon} 
            color="success" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard 
            title="Sales Periods (Data)" 
            value={reports.salesSummary.isLoading ? "..." : salesHistoryCount} 
            icon={AddShoppingCartOutlinedIcon} 
            color="info" 
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3}>
        {/* Stock Chart */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 3, mb: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)", minHeight: 400 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Current Stock Balances</Typography>
            <Box sx={{ width: "100%", height: 350 }}>
              {reports.stockOnHand.isLoading ? (
                <Typography sx={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center" }}>Loading Chart...</Typography>
              ) : stockData.length === 0 ? (
                <Typography sx={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "text.secondary" }}>No Stock Data</Typography>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stockData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="productName" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                    <Bar dataKey="qty" name="Quantity" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Sales Chart (If historical date exists) or Low Stock Table */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 3, mb: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)", minHeight: 400 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom color="error.main">Low Stock Alerts</Typography>
            <DataTable 
              columns={[{ key: "name", label: "Product" }, { key: "qty", label: "Current Qty" }]} 
              rows={reports.lowStock.data || []} 
              loading={reports.lowStock.isLoading} 
            />
          </Paper>
        </Grid>
      </Grid>
      
      <Typography variant="h6" fontWeight={700} sx={{ mt: 2, mb: 2 }}>Full Stock Detail</Typography>
      <Paper sx={{ borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)", overflow: "hidden" }}>
        <DataTable 
          columns={[{ key: "productName", label: "Product" }, { key: "qty", label: "Qty" }]} 
          rows={stockData} 
          loading={reports.stockOnHand.isLoading} 
        />
      </Paper>
    </Box>
  );
}
