import React from "react";
import { Box, Button, Chip, Grid, Paper, Stack, Typography } from "@mui/material";
import TextField from "../../components/CustomTextField";;
import { api } from "../../api/client";
import { useToast } from "../../hooks/useToast";
import {
  useCreatePayrollRun,
  useFinalizePayrollRun,
  useMarkPayrollPaid,
  usePayrollPreview,
  usePayrollRuns
} from "../../hooks/usePayroll";
import DataTable from "../../components/DataTable";
import RowActionMenu from "../../components/RowActionMenu";

function currentMonth() {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

export default function Payroll() {
  const [month, setMonth] = React.useState(currentMonth());
  const { notify } = useToast();
  const preview = usePayrollPreview();
  const createRun = useCreatePayrollRun();
  const finalizeRun = useFinalizePayrollRun();
  const markPaid = useMarkPayrollPaid();
  const { data: runsData, isLoading: runsLoading } = usePayrollRuns({ page: 1, limit: 20 });

  const handlePreview = async () => {
    try {
      await preview.mutateAsync(month);
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed to preview payroll", "error");
    }
  };

  const handleGenerateRun = async () => {
    try {
      await createRun.mutateAsync({ month, overwrite: true });
      notify("Payroll run generated", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed to generate payroll run", "error");
    }
  };

  const handleFinalize = async (id: string) => {
    try {
      await finalizeRun.mutateAsync(id);
      notify("Payroll finalized", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed to finalize payroll", "error");
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await markPaid.mutateAsync(id);
      notify("Payroll marked paid", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed to mark payroll paid", "error");
    }
  };

  const handleExport = async (id: string) => {
    try {
      const { data } = await api.get(`/payroll/runs/${id}/export`, { responseType: "text" });
      const blob = new Blob([data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payroll-${id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed to export payroll", "error");
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Payroll Management
      </Typography>

      <Paper sx={{ p: 2.5, borderRadius: 3, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Payroll Month (YYYY-MM)"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <Button variant="outlined" onClick={handlePreview} disabled={preview.isPending}>
                Preview Payroll
              </Button>
              <Button variant="contained" onClick={handleGenerateRun} disabled={createRun.isPending}>
                Generate/Refresh Run
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {preview.data ? (
        <Paper sx={{ p: 2.5, borderRadius: 3, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Preview Summary
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label={`Employees: ${preview.data.summary?.totalEmployees || 0}`} />
            <Chip label={`Basic: ${Number(preview.data.summary?.totalBasicPay || 0).toLocaleString()}`} />
            <Chip label={`Overtime: ${Number(preview.data.summary?.totalOvertimePay || 0).toLocaleString()}`} />
            <Chip label={`Net: ${Number(preview.data.summary?.totalNetPay || 0).toLocaleString()}`} color="primary" />
          </Stack>
        </Paper>
      ) : null}

      <DataTable
        title="Payroll Runs"
        subtitle={`${runsData?.items?.length || 0} records`}
        columns={[
          { key: "month", label: "Month" },
          { key: "status", label: "Status" },
          { key: "employees", label: "Employees", render: (row: any) => (row.entries || []).length },
          { key: "totalNetPay", label: "Total Net", render: (row: any) => Number(row.totalNetPay || 0).toLocaleString() },
          {
            key: "actions",
            label: "Actions",
            render: (row: any) => (
              <RowActionMenu
                actions={[
                  { label: "Export", onClick: () => handleExport(row._id) },
                  { label: "Finalize", disabled: row.status !== "DRAFT", onClick: () => handleFinalize(row._id) },
                  { label: "Mark Paid", disabled: row.status === "PAID", onClick: () => handleMarkPaid(row._id) }
                ]}
              />
            )
          }
        ]}
        rows={runsData?.items || []}
        loading={runsLoading}
      />
    </Box>
  );
}
