import React from "react";
import {
  Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, InputLabel, MenuItem, Paper, Select, Skeleton, Stack, Table,
  TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow,
  TextField, Tooltip, Typography
} from "@mui/material";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import PageHeader from "../../components/PageHeader";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import { useToast } from "../../hooks/useToast";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

const MONTH_START = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
const MONTH_LABEL = new Date().toLocaleString("default", { month: "long", year: "numeric" });

function approvalStatus(row: any): "approved" | "blocked" | "pending" {
  if (!row.isActive) return "blocked";
  if (row.lastApprovedAt && new Date(row.lastApprovedAt) >= MONTH_START) return "approved";
  return "pending";
}

const STATUS_CFG = {
  approved: { label: "Approved", color: "success" as const },
  blocked:  { label: "Blocked",  color: "error"   as const },
  pending:  { label: "Pending",  color: "warning"  as const }
};

export default function MonthlyBilling() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const debouncedSearch = useDebouncedValue(search.trim());

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [bulkDialog, setBulkDialog] = React.useState(false);
  const [bulkNote, setBulkNote] = React.useState("");
  const [singleDialog, setSingleDialog] = React.useState<{ open: boolean; id: string; name: string }>({ open: false, id: "", name: "" });
  const [singleNote, setSingleNote] = React.useState("");

  const client = useQueryClient();
  const { notify } = useToast();

  const serverFilters: Record<string, string> = {};
  if (statusFilter === "blocked") serverFilters.status = "BLOCKED";
  else if (statusFilter === "active_only") serverFilters.status = "ACTIVE";

  const { data, isLoading } = useQuery({
    queryKey: ["monthly-billing", page, rowsPerPage, debouncedSearch, statusFilter],
    queryFn: async () => {
      const params: any = { page: page + 1, limit: rowsPerPage };
      if (Object.keys(serverFilters).length) params.filters = JSON.stringify(serverFilters);
      if (debouncedSearch) {
        return (await api.get("/superadmin/businesses/semantic-search", {
          params: { query: debouncedSearch, limit: rowsPerPage }
        })).data.data;
      }
      return (await api.get("/superadmin/businesses", { params })).data.data;
    }
  });

  const allRows: any[] = data?.items || [];

  const visibleRows = React.useMemo(() => {
    if (statusFilter === "approved") return allRows.filter(r => approvalStatus(r) === "approved");
    if (statusFilter === "pending")  return allRows.filter(r => approvalStatus(r) === "pending");
    return allRows;
  }, [allRows, statusFilter]);

  const stats = React.useMemo(() => ({
    approved: allRows.filter(r => approvalStatus(r) === "approved").length,
    pending:  allRows.filter(r => approvalStatus(r) === "pending").length,
    blocked:  allRows.filter(r => approvalStatus(r) === "blocked").length
  }), [allRows]);

  const visibleIds = visibleRows.map((r: any) => String(r._id));
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
  const someVisibleSelected = visibleIds.some(id => selectedIds.has(id));

  const toggleRow = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        visibleIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        visibleIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  const blockBusiness = useMutation({
    mutationFn: async (id: string) =>
      (await api.patch(`/superadmin/businesses/${id}/block`, { reason: "Monthly subscription payment not received." })).data.data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["monthly-billing"] });
      client.invalidateQueries({ queryKey: ["businesses"] });
    }
  });

  const unblockBusiness = useMutation({
    mutationFn: async (id: string) =>
      (await api.patch(`/superadmin/businesses/${id}/unblock`)).data.data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["monthly-billing"] });
      client.invalidateQueries({ queryKey: ["businesses"] });
    }
  });

  const approveSingle = useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) =>
      (await api.patch(`/superadmin/businesses/${id}/approve-monthly`, { note })).data.data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["monthly-billing"] });
      client.invalidateQueries({ queryKey: ["businesses"] });
    }
  });

  const approveBulk = useMutation({
    mutationFn: async ({ ids, note }: { ids: string[]; note?: string }) =>
      (await api.post("/superadmin/businesses/bulk-approve-monthly", { ids, note })).data.data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["monthly-billing"] });
      client.invalidateQueries({ queryKey: ["businesses"] });
      setSelectedIds(new Set());
    }
  });

  const handleSingleApprove = async () => {
    try {
      await approveSingle.mutateAsync({ id: singleDialog.id, note: singleNote || undefined });
      notify(`${singleDialog.name} approved for ${MONTH_LABEL}`, "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    } finally {
      setSingleDialog({ open: false, id: "", name: "" });
      setSingleNote("");
    }
  };

  const handleBulkApprove = async () => {
    const ids = Array.from(selectedIds);
    try {
      const result = await approveBulk.mutateAsync({ ids, note: bulkNote || undefined });
      notify(`Approved ${result?.succeeded ?? ids.length} businesses for ${MONTH_LABEL}`, "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    } finally {
      setBulkDialog(false);
      setBulkNote("");
    }
  };

  React.useEffect(() => { setPage(0); }, [debouncedSearch, statusFilter]);
  React.useEffect(() => { setSelectedIds(new Set()); }, [page, rowsPerPage]);

  const pendingUnapprovedCount = allRows.filter(r => approvalStatus(r) === "pending").length;

  return (
    <Box>
      <PageHeader
        title="Monthly Billing"
        subtitle={`Cash subscription approvals — ${MONTH_LABEL}`}
        actionLabel={selectedIds.size > 0 ? `Approve Selected (${selectedIds.size})` : undefined}
        onAction={selectedIds.size > 0 ? () => setBulkDialog(true) : undefined}
      />

      {/* Summary chips */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 2.5, flexWrap: "wrap", gap: 1 }}>
        <Chip
          icon={<TaskAltRoundedIcon />}
          label={`${stats.approved} Approved this month`}
          color="success"
          variant="outlined"
          size="small"
        />
        <Chip
          label={`${stats.pending} Pending`}
          color="warning"
          variant="outlined"
          size="small"
        />
        <Chip
          label={`${stats.blocked} Blocked`}
          color="error"
          variant="outlined"
          size="small"
        />
      </Stack>

      <Paper sx={{ borderRadius: 1, overflow: "hidden" }}>
        {/* Toolbar */}
        <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Businesses</Typography>
            <Typography variant="caption" color="text.secondary">
              {data?.total ?? visibleRows.length} total
              {pendingUnapprovedCount > 0 && ` · ${pendingUnapprovedCount} pending on this page`}
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ ml: "auto", alignItems: { xs: "stretch", sm: "center" } }}>
            <TextField
              size="small"
              placeholder="Search businesses"
              value={search}
              onChange={e => setSearch(e.target.value)}
              sx={{ minWidth: 220 }}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Approval Status</InputLabel>
              <Select
                label="Approval Status"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="blocked">Blocked</MenuItem>
              </Select>
            </FormControl>
            {selectedIds.size > 0 && (
              <Button
                variant="contained"
                color="success"
                size="small"
                onClick={() => setBulkDialog(true)}
              >
                Approve Selected ({selectedIds.size})
              </Button>
            )}
          </Stack>
        </Box>

        <TableContainer sx={{ maxHeight: 560, overflowX: "auto" }}>
          <Table size="small" stickyHeader sx={{ minWidth: 820 }}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    size="small"
                    indeterminate={someVisibleSelected && !allVisibleSelected}
                    checked={allVisibleSelected}
                    onChange={toggleAll}
                  />
                </TableCell>
                {["Business", "Admin Email", "Phone", "City", "Last Approved", `${MONTH_LABEL} Status`, "Action"].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, textTransform: "uppercase", fontSize: "0.72rem", letterSpacing: 0.6, whiteSpace: "nowrap" }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}><Skeleton variant="text" width={i % 2 === 0 ? "70%" : "55%"} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : visibleRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                      No businesses found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                visibleRows.map((row: any) => {
                  const id = String(row._id);
                  const status = approvalStatus(row);
                  const cfg = STATUS_CFG[status];
                  const isSelected = selectedIds.has(id);
                  return (
                    <TableRow
                      key={id}
                      selected={isSelected}
                      sx={{
                        "&:nth-of-type(even)": { backgroundColor: "rgba(148,163,184,0.08)" },
                        "&:hover": { backgroundColor: "rgba(14,165,233,0.08)" },
                        "&.Mui-selected": { backgroundColor: "rgba(14,165,233,0.12)" }
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={isSelected}
                          onChange={() => toggleRow(id)}
                          disabled={status === "approved"}
                        />
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap", fontWeight: 600 }}>{row.name}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{row.adminEmail || "—"}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{row.contactPhone || "—"}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{row.city || "—"}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {row.lastApprovedAt
                          ? new Date(row.lastApprovedAt).toLocaleDateString()
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={cfg.label} color={cfg.color} />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.8} alignItems="center">
                          {status !== "approved" && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              startIcon={<TaskAltRoundedIcon fontSize="small" />}
                              onClick={() => { setSingleDialog({ open: true, id, name: row.name }); setSingleNote(""); }}
                            >
                              Approve
                            </Button>
                          )}
                          {status === "blocked" ? (
                            <Tooltip title="Unblock business">
                              <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                startIcon={<LockOpenRoundedIcon fontSize="small" />}
                                onClick={async () => {
                                  try {
                                    await unblockBusiness.mutateAsync(id);
                                    notify(`${row.name} unblocked`, "success");
                                  } catch {
                                    notify("Failed to unblock", "error");
                                  }
                                }}
                                disabled={unblockBusiness.isPending}
                              >
                                Unblock
                              </Button>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Block business immediately">
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<BlockRoundedIcon fontSize="small" />}
                                onClick={async () => {
                                  try {
                                    await blockBusiness.mutateAsync(id);
                                    notify(`${row.name} blocked`, "success");
                                  } catch {
                                    notify("Failed to block", "error");
                                  }
                                }}
                                disabled={blockBusiness.isPending}
                              >
                                Block
                              </Button>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={data?.total ?? visibleRows.length}
          page={page}
          onPageChange={(_, next) => setPage(next)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[10, 20, 50, 100]}
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} of ${count}`}
          sx={{ "& .MuiTablePagination-toolbar": { flexWrap: "wrap", justifyContent: "flex-end" }, "& .MuiTablePagination-spacer": { display: "none" } }}
        />
      </Paper>

      {/* Single approve dialog */}
      <Dialog open={singleDialog.open} onClose={() => setSingleDialog({ open: false, id: "", name: "" })} maxWidth="xs" fullWidth>
        <DialogTitle>Approve Monthly Payment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Confirm monthly payment received for <strong>{singleDialog.name}</strong> — {MONTH_LABEL}?
          </Typography>
          <TextField
            fullWidth
            size="small"
            label="Note (optional)"
            value={singleNote}
            onChange={e => setSingleNote(e.target.value)}
            placeholder="e.g. Cash received at office"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSingleDialog({ open: false, id: "", name: "" })}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleSingleApprove}
            disabled={approveSingle.isPending}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk approve dialog */}
      <Dialog open={bulkDialog} onClose={() => setBulkDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Bulk Approve Monthly Payment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Confirm monthly payment received for <strong>{selectedIds.size} selected businesses</strong> — {MONTH_LABEL}?
          </Typography>
          <TextField
            fullWidth
            size="small"
            label="Note (optional)"
            value={bulkNote}
            onChange={e => setBulkNote(e.target.value)}
            placeholder="e.g. Batch approved after cash collection"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleBulkApprove}
            disabled={approveBulk.isPending}
          >
            Approve All ({selectedIds.size})
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
