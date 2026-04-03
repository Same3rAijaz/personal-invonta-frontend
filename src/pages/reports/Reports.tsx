import React from "react";
import { Box, Typography, Grid, Paper, useTheme } from "@mui/material";
import { useReports } from "../../hooks/useReports";
import { useProducts } from "../../hooks/useProducts";
import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import { SummaryCard } from "../../components/SummaryCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import InventoryOutlined from "@mui/icons-material/InventoryOutlined";
import AddShoppingCartOutlinedIcon from "@mui/icons-material/AddShoppingCartOutlined";
import AttachMoneyOutlinedIcon from "@mui/icons-material/AttachMoneyOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";

export default function Reports() {
  const theme = useTheme();
  const reports = useReports();
  const { data: productsData } = useProducts({ page: 1, limit: 1000 });

  const stockData = React.useMemo(() => {
    return (reports.stockOnHand.data || []).map((s: any) => ({
      ...s,
      productName:
        productsData?.items?.find((p: any) => p._id === s.productId)?.name || s.productId
    }));
  }, [reports.stockOnHand.data, productsData]);

  const totalStock = stockData.reduce((acc: number, item: any) => acc + (item.qty || 0), 0);
  const lowStockCount = reports.lowStock.data?.length || 0;
  const valuationTotal = reports.valuation.data?.totalValue || 0;
  const salesHistoryCount = reports.salesSummary.data?.total || 0;

  const valuationDisplay = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
    style: "currency",
    currency: "USD",
  }).format(valuationTotal);

  return (
    <Box>
      <PageHeader title="Analytics & Reports" />

      {/* Summary Cards */}
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mt: 0.5, mb: { xs: 3, md: 4 } }}>
        <Grid item xs={6} sm={6} md={3}>
          <SummaryCard
            title="Total Stock Qty"
            value={reports.stockOnHand.isLoading ? "..." : totalStock}
            icon={InventoryOutlined}
            color="primary"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <SummaryCard
            title="Low Stock Items"
            value={reports.lowStock.isLoading ? "..." : lowStockCount}
            icon={ErrorOutlineOutlinedIcon}
            color="error"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <SummaryCard
            title="Inventory Value"
            value={reports.valuation.isLoading ? "..." : valuationDisplay}
            icon={AttachMoneyOutlinedIcon}
            color="success"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <SummaryCard
            title="Sales Periods"
            value={reports.salesSummary.isLoading ? "..." : salesHistoryCount}
            icon={AddShoppingCartOutlinedIcon}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
        {/* Stock Chart */}
        <Grid item xs={12} md={7}>
          <Paper
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 2.5,
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "none",
              mb: { xs: 0, md: 0 },
              minHeight: 380,
            }}
          >
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Current Stock Balances
            </Typography>
            <Box sx={{ width: "100%", height: 320 }}>
              {reports.stockOnHand.isLoading ? (
                <Typography sx={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "text.secondary" }}>
                  Loading chart…
                </Typography>
              ) : stockData.length === 0 ? (
                <Typography sx={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "text.secondary" }}>
                  No stock data available
                </Typography>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stockData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                    <XAxis
                      dataKey="productName"
                      tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                      axisLine={false}
                      tickLine={false}
                      dy={8}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: theme.palette.action.hover }}
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid",
                        borderColor: theme.palette.divider,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                        fontSize: 13,
                      }}
                    />
                    <Bar dataKey="qty" name="Quantity" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} barSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Low Stock Alerts */}
        <Grid item xs={12} md={5}>
          <Paper
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 2.5,
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "none",
              minHeight: 380,
            }}
          >
            <Typography variant="h6" fontWeight={700} gutterBottom color="error.main">
              Low Stock Alerts
            </Typography>
            <DataTable
              columns={[
                { key: "name", label: "Product" },
                { key: "qty", label: "Current Qty" },
              ]}
              rows={reports.lowStock.data || []}
              loading={reports.lowStock.isLoading}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Full inventory table */}
      <Typography variant="h6" fontWeight={700} sx={{ mt: { xs: 3, md: 4 }, mb: 2 }}>
        Full Stock Detail
      </Typography>
      <Paper sx={{ borderRadius: 2.5, border: "1px solid", borderColor: "divider", boxShadow: "none", overflow: "hidden" }}>
        <DataTable
          columns={[
            { key: "productName", label: "Product" },
            { key: "qty", label: "Qty" },
          ]}
          rows={stockData}
          loading={reports.stockOnHand.isLoading}
        />
      </Paper>
    </Box>
  );
}
