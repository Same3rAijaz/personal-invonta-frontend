import React from "react";
import {
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import { api } from "../../api/client";
import { useToast } from "../../hooks/useToast";
import {
  useCreatePayrollRun,
  useFinalizePayrollRun,
  useMarkPayrollPaid,
  usePayrollPreview,
  usePayrollRuns
} from "../../hooks/usePayroll";

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
  const { data: runsData } = usePayrollRuns({ page: 1, limit: 20 });

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

      <Paper sx={{ p: 2.5, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          Payroll Runs
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Month</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Employees</TableCell>
              <TableCell>Total Net</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(runsData?.items || []).map((run: any) => (
              <TableRow key={run._id}>
                <TableCell>{run.month}</TableCell>
                <TableCell>{run.status}</TableCell>
                <TableCell>{(run.entries || []).length}</TableCell>
                <TableCell>{Number(run.totalNetPay || 0).toLocaleString()}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button size="small" onClick={() => handleExport(run._id)}>
                      Export
                    </Button>
                    {run.status === "DRAFT" ? (
                      <Button size="small" onClick={() => handleFinalize(run._id)}>
                        Finalize
                      </Button>
                    ) : null}
                    {run.status !== "PAID" ? (
                      <Button size="small" variant="contained" onClick={() => handleMarkPaid(run._id)}>
                        Mark Paid
                      </Button>
                    ) : null}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
