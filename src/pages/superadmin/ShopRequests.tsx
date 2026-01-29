import React from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import { useToast } from "../../hooks/useToast";

export default function ShopRequests() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const { notify } = useToast();
  const client = useQueryClient();
  const { data } = useQuery({
    queryKey: ["shop-requests", page, rowsPerPage],
    queryFn: async () => (await api.get("/superadmin/requests", { params: { page: page + 1, limit: rowsPerPage } })).data.data
  });
  const approve = useMutation({
    mutationFn: async (id: string) => (await api.patch(`/superadmin/requests/${id}/approve`, {})).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["shop-requests"] })
  });
  const reject = useMutation({
    mutationFn: async (payload: { id: string; reason?: string }) =>
      (await api.patch(`/superadmin/requests/${payload.id}/reject`, { reason: payload.reason })).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["shop-requests"] })
  });

  const [rejectDialog, setRejectDialog] = React.useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [rejectReason, setRejectReason] = React.useState("");

  const handleApprove = async (id: string) => {
    try {
      await approve.mutateAsync(id);
      notify("Request approved", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.id) return;
    try {
      await reject.mutateAsync({ id: rejectDialog.id, reason: rejectReason || undefined });
      notify("Request rejected", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    } finally {
      setRejectDialog({ open: false, id: null });
      setRejectReason("");
    }
  };

  const rows = (data?.items || []).map((row: any) => ({
    ...row,
    modulesText: (row.requestedModules || []).join(", ")
  }));

  return (
    <Box>
      <PageHeader title="Approval Requests" />
      <DataTable
        columns={[
          { key: "businessName", label: "Business" },
          { key: "adminEmail", label: "Admin Email" },
          { key: "modulesText", label: "Requested Modules" },
          { key: "status", label: "Status" },
          {
            key: "actions",
            label: "Actions",
            render: (row: any) => (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button size="small" disabled={row.status !== "PENDING"} onClick={() => handleApprove(row._id)}>
                  Approve
                </Button>
                <Button
                  size="small"
                  color="error"
                  disabled={row.status !== "PENDING"}
                  onClick={() => setRejectDialog({ open: true, id: row._id })}
                >
                  Reject
                </Button>
              </Box>
            )
          }
        ]}
        rows={rows}
        page={page}
        rowsPerPage={rowsPerPage}
        total={data?.total || 0}
        onPageChange={setPage}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value);
          setPage(0);
        }}
      />

      <Dialog open={rejectDialog.open} onClose={() => setRejectDialog({ open: false, id: null })} maxWidth="xs" fullWidth>
        <DialogTitle>Reject Request</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Reason (optional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog({ open: false, id: null })}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleReject}>
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
