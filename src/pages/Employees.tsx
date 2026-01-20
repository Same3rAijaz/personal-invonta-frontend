import React from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { useDeleteEmployee, useEmployees } from "../hooks/useEmployees";
import { useWarehouses } from "../hooks/useWarehouses";
import DataTable from "../components/DataTable";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { useToast } from "../hooks/useToast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export default function Employees() {
  const { data } = useEmployees();
  const deleteEmployee = useDeleteEmployee();
  const { data: warehouses } = useWarehouses();
  const navigate = useNavigate();
  const warehouseMap = new Map((warehouses?.items || []).map((w: any) => [w._id, w.name]));
  const rows = (data?.items || []).map((emp: any) => ({
    ...emp,
    assignedWarehouseName: warehouseMap.get(emp.assignedWarehouse) || emp.assignedWarehouse
  }));
  const { notify } = useToast();
  const client = useQueryClient();
  const [blockDialog, setBlockDialog] = React.useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [blockReason, setBlockReason] = React.useState("");
  const [blockReasonOther, setBlockReasonOther] = React.useState("");
  const [blockDays, setBlockDays] = React.useState("");
  const blockLogin = useMutation({
    mutationFn: async (payload: { id: string; until?: string; reason?: string }) =>
      (await api.patch(`/employees/${payload.id}/block-login`, { until: payload.until, reason: payload.reason })).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["employees"] })
  });
  const unblockLogin = useMutation({
    mutationFn: async (id: string) => (await api.patch(`/employees/${id}/unblock-login`)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["employees"] })
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this employee?")) return;
    try {
      await deleteEmployee.mutateAsync(id);
      notify("Employee deleted", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  const handleOpenBlockLogin = (id: string) => {
    setBlockDialog({ open: true, id });
    setBlockReason("");
    setBlockReasonOther("");
    setBlockDays("");
  };

  const handleConfirmBlockLogin = async () => {
    if (!blockDialog.id) return;
    const reasonValue = blockReason === "Other" ? blockReasonOther : blockReason;
    const until = blockDays ? new Date(Date.now() + Number(blockDays) * 24 * 60 * 60 * 1000).toISOString() : undefined;
    try {
      await blockLogin.mutateAsync({ id: blockDialog.id, until, reason: reasonValue || undefined });
      notify("Employee login blocked", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    } finally {
      setBlockDialog({ open: false, id: null });
    }
  };

  const handleUnblockLogin = async (id: string) => {
    try {
      await unblockLogin.mutateAsync(id);
      notify("Employee login unblocked", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <Box>
      <PageHeader title="Employees" actionLabel="Create Employee" onAction={() => navigate("/employees/new")} />
      <DataTable
        columns={[
          { key: "name", label: "Name" },
          { key: "employeeId", label: "Employee ID" },
          { key: "department", label: "Department" },
          { key: "role", label: "Role" },
          { key: "assignedWarehouseName", label: "Warehouse" },
          { key: "isActive", label: "Active" },
          {
            key: "actions",
            label: "Actions",
            render: (row: any) => (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button size="small" onClick={() => navigate(`/employees/${row._id}/edit`)}>
                  Edit
                </Button>
                <Button size="small" color="error" onClick={() => handleDelete(row._id)}>
                  Delete
                </Button>
                {row.userId ? (
                  <>
                    <Button size="small" onClick={() => handleOpenBlockLogin(row._id)}>
                      Block Login
                    </Button>
                    <Button size="small" onClick={() => handleUnblockLogin(row._id)}>
                      Unblock Login
                    </Button>
                  </>
                ) : null}
              </Box>
            )
          }
        ]}
        rows={rows}
      />
      <Dialog open={blockDialog.open} onClose={() => setBlockDialog({ open: false, id: null })} maxWidth="xs" fullWidth>
        <DialogTitle>Block Employee Login</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="employee-block-reason-label">Reason</InputLabel>
            <Select
              labelId="employee-block-reason-label"
              label="Reason"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value as string)}
            >
              <MenuItem value="Payment overdue">Payment overdue</MenuItem>
              <MenuItem value="Policy violation">Policy violation</MenuItem>
              <MenuItem value="Suspicious activity">Suspicious activity</MenuItem>
              <MenuItem value="Customer request">Customer request</MenuItem>
              <MenuItem value="Maintenance">Maintenance</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
          {blockReason === "Other" ? (
            <TextField
              fullWidth
              label="Custom reason"
              value={blockReasonOther}
              onChange={(e) => setBlockReasonOther(e.target.value)}
              sx={{ mt: 2 }}
            />
          ) : null}
          <TextField
            fullWidth
            type="number"
            label="Block for days (blank = permanent)"
            value={blockDays}
            onChange={(e) => setBlockDays(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBlockDialog({ open: false, id: null })}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmBlockLogin}>Block</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
