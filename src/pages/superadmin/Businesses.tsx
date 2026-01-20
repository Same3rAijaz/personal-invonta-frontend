import React from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/useToast";

export default function Businesses() {
  const navigate = useNavigate();
  const client = useQueryClient();
  const { notify } = useToast();
  const [blockDialog, setBlockDialog] = React.useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [blockReason, setBlockReason] = React.useState("");
  const [blockReasonOther, setBlockReasonOther] = React.useState("");
  const [blockDays, setBlockDays] = React.useState("");
  const { data } = useQuery({
    queryKey: ["businesses"],
    queryFn: async () => (await api.get("/superadmin/businesses")).data.data
  });
  const deleteBusiness = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/superadmin/businesses/${id}`)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["businesses"] })
  });
  const blockBusiness = useMutation({
    mutationFn: async (payload: { id: string; until?: string; reason?: string }) =>
      (await api.patch(`/superadmin/businesses/${payload.id}/block`, { until: payload.until, reason: payload.reason })).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["businesses"] })
  });
  const unblockBusiness = useMutation({
    mutationFn: async (id: string) => (await api.patch(`/superadmin/businesses/${id}/unblock`)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["businesses"] })
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this business?")) return;
    try {
      await deleteBusiness.mutateAsync(id);
      notify("Business deleted", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  const handleOpenBlock = (id: string) => {
    setBlockDialog({ open: true, id });
    setBlockReason("");
    setBlockReasonOther("");
    setBlockDays("");
  };

  const handleConfirmBlock = async () => {
    if (!blockDialog.id) return;
    const reasonValue = blockReason === "Other" ? blockReasonOther : blockReason;
    const until = blockDays ? new Date(Date.now() + Number(blockDays) * 24 * 60 * 60 * 1000).toISOString() : undefined;
    try {
      await blockBusiness.mutateAsync({ id: blockDialog.id, until, reason: reasonValue || undefined });
      notify("Business blocked", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    } finally {
      setBlockDialog({ open: false, id: null });
    }
  };

  const handleUnblock = async (id: string) => {
    try {
      await unblockBusiness.mutateAsync(id);
      notify("Business unblocked", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <Box>
      <PageHeader title="Businesses" actionLabel="Create Business" onAction={() => navigate("/superadmin/businesses/new")} />
      <DataTable
        columns={[
          { key: "name", label: "Name" },
          { key: "marketId", label: "Market" },
          { key: "contactPhone", label: "Phone" },
          {
            key: "status",
            label: "Status",
            render: (row: any) => {
              if (!row.isActive) return "Blocked";
              if (row.blockedUntil && new Date(row.blockedUntil) > new Date()) return "Temp Block";
              return "Active";
            }
          },
          {
            key: "actions",
            label: "Actions",
            render: (row: any) => (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button size="small" onClick={() => navigate(`/superadmin/businesses/${row._id}/edit`)}>
                  Edit
                </Button>
                <Button size="small" onClick={() => handleOpenBlock(row._id)}>
                  Block
                </Button>
                <Button size="small" onClick={() => handleUnblock(row._id)}>
                  Unblock
                </Button>
                <Button size="small" color="error" onClick={() => handleDelete(row._id)}>
                  Delete
                </Button>
              </Box>
            )
          }
        ]}
        rows={data || []}
      />
      <Dialog open={blockDialog.open} onClose={() => setBlockDialog({ open: false, id: null })} maxWidth="xs" fullWidth>
        <DialogTitle>Block Business</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="block-reason-label">Reason</InputLabel>
            <Select
              labelId="block-reason-label"
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
          <Button variant="contained" onClick={handleConfirmBlock}>Block</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
