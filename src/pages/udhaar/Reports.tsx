import React from "react";
import { Box, Grid, Typography, Paper, Stack, useTheme, SvgIconProps } from "@mui/material";
import PageHeader from "../../components/PageHeader";
import { useAgingReport, useReceivablesReport } from "../../hooks/useUdhaar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import ArrowUpwardOutlinedIcon from "@mui/icons-material/ArrowUpwardOutlined";
import ArrowDownwardOutlinedIcon from "@mui/icons-material/ArrowDownwardOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";

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

export default function UdhaarReports() {
  const { data: receivables } = useReceivablesReport({});
  const { data: aging } = useAgingReport({});

  return (
    <Box>
      <PageHeader title="Udhaar Reports" />
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <SummaryCard 
            title="Total Receivable" 
            value={`$${(receivables?.totalReceivable ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
            icon={ArrowUpwardOutlinedIcon} 
            color="success" 
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <SummaryCard 
            title="Total Payable" 
            value={`$${(receivables?.totalPayable ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
            icon={ArrowDownwardOutlinedIcon} 
            color="error" 
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <SummaryCard 
            title="Net Balance" 
            value={`$${(receivables?.net ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
            icon={AccountBalanceWalletOutlinedIcon} 
            color="primary" 
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)", minHeight: 400 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>Accounts Aging Summary</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Visual breakdown of overdue receivable intervals
        </Typography>
        
        <Box sx={{ width: "100%", height: 350 }}>
          {aging?.buckets ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={Object.entries(aging.buckets).map(([label, value]) => ({ name: `${label} Days`, amount: Number(value) }))} 
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  cursor={{ fill: "transparent" }} 
                  contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount Due']}
                />
                <Bar dataKey="amount" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center" }}>
              <Typography color="text.secondary">No aging data available.</Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
