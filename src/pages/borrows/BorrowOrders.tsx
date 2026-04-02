import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  MenuItem, Paper, Stack, Tab, Tabs, TextField, Typography
} from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  useActivateBorrowOrder, useApproveBorrowOrder,
  useBorrowOrders, useRejectBorrowOrder
} from "../../hooks/useBorrows";
import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import RowActionMenu from "../../components/RowActionMenu";
import { useToast } from "../../hooks/useToast";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { useWarehouses } from "../../hooks/useWarehouses";
import { useAuth } from "../../hooks/useAuth";

const statusColor: Record<string, "default" | "warning" | "info" | "success" | "error"> = {
  PENDING: "warning",
  APPROVED: "info",
  ACTIVE: "success",
  PARTIALLY_RETURNED: "info",
  FULLY_RETURNED: "default",
  REJECTED: "error",
  CANCELLED: "error"
};

const statusLabel: Record<string, string> = {
  PENDING: "Awaiting Approval",
  APPROVED: "Approved — Transfer Pending",
  ACTIVE: "Active",
  PARTIALLY_RETURNED: "Partially Returned",
  FULLY_RETURNED: "Fully Returned",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled"
};

export default function BorrowOrders() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const [tab, setTab] = React.useState<"all" | "borrower" | "lender">("all");

  const [approveDialog, setApproveDialog] = React.useState<{ open: boolean; bo: any }>({ open: false, bo: null });
  const [warehouseAssignments, setWarehouseAssignments] = React.useState<Record<string, string>>({});
  const [activateId, setActivateId] = React.useState<string | null>(null);

  const { data: warehouses } = useWarehouses({ page: 1, limit: 1000 });
  const { business } = useAuth();
  const myBusinessId = String((business as any)?._id || "");

  const roleParam = tab === "all" ? undefined : tab;
  const { data, isLoading } = useBorrowOrders({ page: page + 1, limit: rowsPerPage, role: roleParam });
  const approve = useApproveBorrowOrder();
  const reject = useRejectBorrowOrder();
  const activate = useActivateBorrowOrder();
  const navigate = useNavigate();
  const { notify } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();

  const { data: lendRequests } = useBorrowOrders({ page: 1, limit: 100, role: "lender" });
  const pendingCount = (lendRequests?.items || []).filter((b: any) => b.status === "PENDING").length;

  const openApproveDialog = (bo: any) => {
    const initial: Record<string, string> = {};
    (bo.items || []).forEach((i: any) => { initial[String(i.productId)] = ""; });
    setWarehouseAssignments(initial);
    setApproveDialog({ open: true, bo });
  };

  const handleApprove = async () => {
    const bo = approveDialog.bo;
    const items = (bo?.items || []).map((i: any) => ({
      productId: String(i.productId),
      lenderWarehouseId: warehouseAssignments[String(i.productId)] || ""
    }));
    if (items.some((i: any) => !i.lenderWarehouseId)) {
      notify("Assign a warehouse for every item", "error");
      return;
    }
    try {
      await approve.mutateAsync({ id: bo._id, payload: { items } });
      notify("Loan request approved", "success");
      setApproveDialog({ open: false, bo: null });
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  const handleReject = async (id: string) => {
    if (!(await confirm({ title: "Reject Loan Request", message: "Reject this stock loan request?", confirmText: "Reject" }))) return;
    try { await reject.mutateAsync(id); notify("Loan request rejected", "success"); }
    catch (err: any) { notify(err?.response?.data?.error?.message || "Failed", "error"); }
  };

  const handleActivate = async () => {
    if (!activateId) return;
    try {
      await activate.mutateAsync(activateId);
      notify("Stock transferred — loan is now ACTIVE", "success");
      setActivateId(null);
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  const rows = (data?.items || []).map((bo: any) => {
    const isLender = String(bo.lenderBusinessId) === myBusinessId;
    const isBorrower = String(bo.borrowerBusinessId) === myBusinessId;
    const otherParty = isLender
      ? bo.borrowerBusiness?.name || `Shop …${String(bo.borrowerBusinessId || "").slice(-6)}`
      : isBorrower
      ? bo.lenderBusiness?.name || `Shop …${String(bo.lenderBusinessId || "").slice(-6)}`
      : "—";
    const role = isLender ? "Lending" : isBorrower ? "Borrowing" : "—";
    const productNames = (bo.items || []).map((i: any) => i.productName || i.product?.name || `…${String(i.productId || "").slice(-4)}`).join(", ");
    return { ...bo, itemsCount: bo.items?.length || 0, productNames, otherParty, role, isLender, isBorrower };
  });

  return (
    <Box>
      <PageHeader title="Stock Loans" actionLabel="Request a Stock Loan" onAction={() => navigate("/borrows/new")} />

      <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(0); }} sx={{ mb: 2 }}>
        <Tab label="All" value="all" />
        <Tab label="Borrowed Stock" value="borrower" />
        <Tab
          label={
            <Stack direction="row" spacing={0.5} alignItems="center">
              <span>Lending Requests</span>
              {pendingCount > 0 && (
                <Chip label={pendingCount} size="small" color="warning" sx={{ height: 18, fontSize: 11 }} />
              )}
            </Stack>
          }
          value="lender"
        />
      </Tabs>

      {tab === "lender" && pendingCount > 0 && (
        <Paper
          sx={{
            p: 2, mb: 2, borderRadius: 2,
            background: "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.04) 100%)",
            border: "1px solid rgba(245,158,11,0.3)"
          }}
        >
          <Typography variant="body2" fontWeight={600} color="warning.dark">
            You have {pendingCount} pending loan request{pendingCount > 1 ? "s" : ""} waiting for your approval.
          </Typography>
        </Paper>
      )}

      <DataTable
        columns={[
          { key: "number", label: "Order #" },
          { key: "role", label: "Your Role" },
          { key: "otherParty", label: "Other Shop" },
          {
            key: "status",
            label: "Status",
            render: (row: any) => <Chip label={statusLabel[row.status] || row.status} color={statusColor[row.status] || "default"} size="small" />
          },
          {
            key: "productNames",
            label: "Items",
            render: (row: any) => (
              <Box>
                <Typography variant="body2" fontWeight={600}>{row.itemsCount} item{row.itemsCount !== 1 ? "s" : ""}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {row.productNames}
                </Typography>
              </Box>
            )
          },
          {
            key: "totalSettlementDue",
            label: "Settlement Due",
            render: (row: any) => <Typography variant="body2">{(row.totalSettlementDue || 0).toFixed(2)}</Typography>
          },
          {
            key: "actions",
            label: "Actions",
            render: (row: any) => (
              <RowActionMenu
                actions={[
                  { label: "View Details", onClick: () => navigate(`/borrows/${row._id}`) },
                  {
                    label: "Create Sales Order",
                    disabled: !row.isBorrower || !["ACTIVE", "PARTIALLY_RETURNED"].includes(row.status),
                    onClick: () => navigate("/sales/new", {
                      state: {
                        borrowOrderId: row._id,
                        lenderBusinessId: row.lenderBusinessId,
                        items: (row.items || []).map((i: any) => ({
                          productId: String(i.productId),
                          productName: i.productName || i.product?.name || "",
                          qty: i.qty - (i.soldQty || 0) - (i.returnedQty || 0),
                          unitPrice: 0,
                          agreedUnitCost: i.agreedUnitCost || 0
                        })).filter((i: any) => i.qty > 0)
                      }
                    })
                  },
                  {
                    label: "Approve Loan Request",
                    disabled: row.status !== "PENDING",
                    onClick: () => openApproveDialog(row)
                  },
                  {
                    label: "Reject Request",
                    disabled: row.status !== "PENDING",
                    onClick: () => handleReject(row._id),
                    danger: true
                  },
                  {
                    label: "Transfer Stock to Borrower",
                    disabled: row.status !== "APPROVED",
                    onClick: () => setActivateId(row._id)
                  }
                ]}
              />
            )
          }
        ]}
        rows={rows}
        loading={isLoading}
        page={page}
        rowsPerPage={rowsPerPage}
        total={data?.total || 0}
        onPageChange={setPage}
        onRowsPerPageChange={(value) => { setRowsPerPage(value); setPage(0); }}
      />

      {/* Approve loan request dialog */}
      <Dialog open={approveDialog.open} onClose={() => setApproveDialog({ open: false, bo: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Loan Request — {approveDialog.bo?.number}</DialogTitle>
        <DialogContent sx={{ pt: "12px !important" }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Assign one of your warehouses to each item. Stock will be pulled from there when the borrower confirms the transfer.
          </Typography>
          {(approveDialog.bo?.items || []).map((item: any) => {
            const productName = item.productName || item.product?.name || item.productId;
            return (
              <Stack key={String(item.productId)} direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight={600}>{productName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Qty: {item.qty} &nbsp;·&nbsp; Agreed cost: {item.agreedUnitCost} / unit
                  </Typography>
                </Box>
                <TextField
                  select
                  label="Your Warehouse *"
                  size="small"
                  sx={{ minWidth: 180 }}
                  value={warehouseAssignments[String(item.productId)] || ""}
                  onChange={(e) => setWarehouseAssignments((prev) => ({ ...prev, [String(item.productId)]: e.target.value }))}
                >
                  {(warehouses?.items || []).map((w: any) => (
                    <MenuItem key={w._id} value={w._id}>{w.name}</MenuItem>
                  ))}
                </TextField>
              </Stack>
            );
          })}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialog({ open: false, bo: null })}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleApprove} disabled={approve.isPending}>
            Approve & Assign Warehouses
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transfer stock confirm dialog */}
      <Dialog open={!!activateId} onClose={() => setActivateId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Stock Transfer</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 1 }}>
            This will move stock from the lender's warehouse to your warehouse. The loan order will become ACTIVE and the stock will appear in your inventory.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActivateId(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleActivate} disabled={activate.isPending}>
            Transfer Stock Now
          </Button>
        </DialogActions>
      </Dialog>

      {confirmDialog}
    </Box>
  );
}
