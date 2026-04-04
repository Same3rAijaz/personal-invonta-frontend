import React from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import TextField from "../components/CustomTextField";;
import { useDeleteEmployee, useEmployees, useResetEmployeePassword } from "../hooks/useEmployees";
import DataTable from "../components/DataTable";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { Drawer } from "@mui/material";
import EmployeeCreate from "./employees/EmployeeCreate";
import EmployeeEdit from "./employees/EmployeeEdit";
import { useToast } from "../hooks/useToast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import RowActionMenu from "../components/RowActionMenu";

export default function Employees() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebouncedValue(search.trim());
  const { data, isLoading } = useEmployees({ page: page + 1, limit: rowsPerPage, search: debouncedSearch || undefined });
  const deleteEmployee = useDeleteEmployee();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManageBusinessAdmin = user?.role === "SUPER_ADMIN";
  const rows = data?.items || [];
  const { notify } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();
  const [drawerState, setDrawerState] = React.useState<{ open: boolean; type: "new" | "edit" | null; id: string | null }>({ open: false, type: null, id: null });
  const client = useQueryClient();
  const [blockDialog, setBlockDialog] = React.useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [resetDialog, setResetDialog] = React.useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [resetPassword, setResetPassword] = React.useState("");
  const [blockReason, setBlockReason] = React.useState("");
  const [blockReasonOther, setBlockReasonOther] = React.useState("");
  const [blockDays, setBlockDays] = React.useState("");
  const resetEmployeePassword = useResetEmployeePassword();
  const blockLogin = useMutation({
    mutationFn: async (payload: { id: string; until?: string; reason?: string }) =>
      (await api.patch(`/employees/${payload.id}/block-login`, { until: payload.until, reason: payload.reason })).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["employees"] })
  });
  const unblockLogin = useMutation({
    mutationFn: async (id: string) => (await api.patch(`/employees/${id}/unblock-login`)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["employees"] })
  });

  React.useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  const handleDelete = async (id: string) => {
    if (!(await confirm({ title: "Delete Employee", message: "Are you sure you want to delete this employee?", confirmText: "Delete" }))) return;
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

  const handleOpenResetPassword = (id: string) => {
    setResetDialog({ open: true, id });
    setResetPassword("");
  };

  const handleConfirmResetPassword = async () => {
    if (!resetDialog.id) return;
    try {
      const result = await resetEmployeePassword.mutateAsync({ id: resetDialog.id, password: resetPassword || undefined });
      notify(`Password reset email sent to ${result?.loginEmail || "employee"}`, "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    } finally {
      setResetDialog({ open: false, id: null });
      setResetPassword("");
    }
  };

  return (
    <Box>
      <PageHeader title="Employees" actionLabel="Create Employee" onAction={() => setDrawerState({ open: true, type: "new", id: null })} />
      <DataTable
        columns={[
          { key: "name", label: "Name" },
          { key: "employeeId", label: "Employee ID" },
          { key: "role", label: "Role" },
          { key: "isActive", label: "Active" },
          {
            key: "actions",
            label: "Actions",
            render: (row: any) => (
              <RowActionMenu
                actions={[
                  {
                    label: "Edit",
                    disabled: Boolean(row.isBusinessAdmin) && !canManageBusinessAdmin,
                    onClick: () => setDrawerState({ open: true, type: "edit", id: row._id })
                  },
                  {
                    label: "Delete",
                    danger: true,
                    disabled: Boolean(row.isBusinessAdmin) && !canManageBusinessAdmin,
                    onClick: () => handleDelete(row._id)
                  },
                  {
                    label: "Block Login",
                    disabled: !row.userId || (Boolean(row.isBusinessAdmin) && !canManageBusinessAdmin),
                    onClick: () => handleOpenBlockLogin(row._id)
                  },
                  {
                    label: "Unblock Login",
                    disabled: !row.userId || (Boolean(row.isBusinessAdmin) && !canManageBusinessAdmin),
                    onClick: () => handleUnblockLogin(row._id)
                  },
                  {
                    label: "Reset Password",
                    disabled: !row.userId || (Boolean(row.isBusinessAdmin) && !canManageBusinessAdmin),
                    onClick: () => handleOpenResetPassword(row._id)
                  },
                  {
                    label: "Restricted",
                    disabled: true,
                    onClick: () => undefined
                  }
                ].filter((item) => item.label !== "Restricted" || (row.isBusinessAdmin && !canManageBusinessAdmin))}
              />
            )
          }
        ]}
        rows={rows}
        loading={isLoading}
        actions={
          <TextField
            size="small"
            placeholder="Search employees"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{ minWidth: 240 }}
          />
        }
        page={page}
        rowsPerPage={rowsPerPage}
        total={data?.total || 0}
        onPageChange={setPage}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value);
          setPage(0);
        }}
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
      <Dialog open={resetDialog.open} onClose={() => setResetDialog({ open: false, id: null })} maxWidth="xs" fullWidth>
        <DialogTitle>Reset Employee Password</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="password"
            label="New password (optional)"
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
            sx={{ mt: 1 }}
            helperText="Leave blank to auto-generate a temporary password and email it."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialog({ open: false, id: null })}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmResetPassword} disabled={resetEmployeePassword.isPending}>
            Reset
          </Button>
        </DialogActions>
      </Dialog>
      
      <Drawer anchor="right" open={drawerState.open} onClose={() => setDrawerState({ open: false, type: null, id: null })} sx={{ zIndex: 1300 }} PaperProps={{ sx: { width: { xs: "100%", sm: 600 }, backdropFilter: "blur(16px)" } }}>
        {drawerState.type === "new" && <EmployeeCreate onSuccess={() => setDrawerState({ open: false, type: null, id: null })} onCancel={() => setDrawerState({ open: false, type: null, id: null })} />}
        {drawerState.type === "edit" && drawerState.id && <EmployeeEdit explicitId={drawerState.id} onSuccess={() => setDrawerState({ open: false, type: null, id: null })} onCancel={() => setDrawerState({ open: false, type: null, id: null })} />}
      </Drawer>
      {confirmDialog}
    </Box>
  );
}
