import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, Grid, IconButton, MenuItem, Paper, Stack, TextField, Typography
} from "@mui/material";
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  useActivateBorrowOrder, useApproveBorrowOrder,
  useBorrowOrder, useBorrowProfitSummary, useRejectBorrowOrder, useReturnBorrowOrder
} from "../../hooks/useBorrows";
import { useToast } from "../../hooks/useToast";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { useProducts } from "../../hooks/useProducts";
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
  PENDING: "Awaiting Lender Approval",
  APPROVED: "Approved — Transfer Pending",
  ACTIVE: "Active",
  PARTIALLY_RETURNED: "Partially Returned",
  FULLY_RETURNED: "Fully Returned",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled"
};

export default function BorrowOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { business } = useAuth();
  const { data: bo, isLoading } = useBorrowOrder(id!);
  const { data: profitData } = useBorrowProfitSummary(id!);
  const { data: products } = useProducts({ page: 1, limit: 1000 });
  const { data: warehouses } = useWarehouses({ page: 1, limit: 1000 });
  const approve = useApproveBorrowOrder();
  const reject = useRejectBorrowOrder();
  const activate = useActivateBorrowOrder();
  const returnBO = useReturnBorrowOrder();
  const { notify } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();

  // Approve dialog — lender assigns warehouse per item
  const [approveDialog, setApproveDialog] = React.useState(false);
  const [warehouseAssignments, setWarehouseAssignments] = React.useState<Record<string, string>>({});

  // Return dialog
  const [returnDialog, setReturnDialog] = React.useState(false);
  const [returnQtys, setReturnQtys] = React.useState<Record<string, number>>({});

  const productMap = React.useMemo(
    () => new Map((products?.items || []).map((p: any) => [String(p._id), p])),
    [products?.items]
  );

  const myBusinessId = String((business as any)?._id || "");
  const isLender = bo ? String(bo.lenderBusinessId) === myBusinessId : false;
  const isBorrower = bo ? String(bo.borrowerBusinessId) === myBusinessId : false;

  const openApproveDialog = () => {
    const initial: Record<string, string> = {};
    (bo?.items || []).forEach((i: any) => { initial[String(i.productId)] = ""; });
    setWarehouseAssignments(initial);
    setApproveDialog(true);
  };

  const handleApprove = async () => {
    const items = (bo?.items || []).map((i: any) => ({
      productId: String(i.productId),
      lenderWarehouseId: warehouseAssignments[String(i.productId)] || ""
    }));
    if (items.some((i) => !i.lenderWarehouseId)) {
      notify("Assign a warehouse for every item before approving", "error");
      return;
    }
    try {
      await approve.mutateAsync({ id: id!, payload: { items } });
      notify("Borrow request accepted — borrower can now activate to transfer stock", "success");
      setApproveDialog(false);
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  const handleReject = async () => {
    if (!(await confirm({ title: "Reject Request", message: "Reject this borrow request?", confirmText: "Reject" }))) return;
    try { await reject.mutateAsync(id!); notify("Request rejected", "success"); }
    catch (err: any) { notify(err?.response?.data?.error?.message || "Failed", "error"); }
  };

  const handleActivate = async () => {
    if (!(await confirm({ title: "Transfer Stock", message: "Transfer stock from lender to your warehouse now?", confirmText: "Transfer" }))) return;
    try { await activate.mutateAsync(id!); notify("Stock transferred — borrow is ACTIVE", "success"); }
    catch (err: any) { notify(err?.response?.data?.error?.message || "Failed", "error"); }
  };

  const handleReturn = async () => {
    const items = Object.entries(returnQtys)
      .filter(([, qty]) => qty > 0)
      .map(([productId, qty]) => ({ productId, qty }));
    if (items.length === 0) { notify("Enter at least one return quantity", "error"); return; }
    try {
      await returnBO.mutateAsync({ id: id!, payload: { items } });
      notify("Items returned to lender", "success");
      setReturnDialog(false);
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  if (isLoading) return <Typography>Loading…</Typography>;
  if (!bo) return <Typography>Not found</Typography>;

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate("/borrows")}><ArrowBackIcon /></IconButton>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h5" fontWeight={700}>{bo.number}</Typography>
            <Chip label={statusLabel[bo.status] || bo.status} color={statusColor[bo.status] || "default"} />
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {isLender ? "You are the Lender" : isBorrower ? "You are the Borrower" : ""}
          </Typography>
        </Box>
      </Stack>

      {bo.status === "PENDING" && isLender && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <b>{bo.borrowerBusiness?.name || `Shop …${String(bo.borrowerBusinessId || "").slice(-6)}`}</b> wants to borrow stock from you. Review the items below and approve or reject.
        </Alert>
      )}
      {bo.status === "APPROVED" && isBorrower && (
        <Alert severity="info" sx={{ mb: 3 }}>
          The lender has accepted your request. Click <b>Activate</b> below to transfer the stock to your warehouse.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Loan Items</Typography>
            <Divider sx={{ mb: 2 }} />
            {bo.items?.map((item: any, idx: number) => {
              const product = productMap.get(String(item.productId));
              const productName = item.productName || item.product?.name || product?.name || `Product …${String(item.productId || "").slice(-6)}`;
              const warehouseObj = (warehouses?.items || []).find((w: any) => String(w._id) === String(item.lenderWarehouseId));
              return (
                <Box key={idx} sx={{ py: 1.5, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography fontWeight={600}>{productName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Agreed Cost: <b>{item.agreedUnitCost}</b> / unit
                        {item.lenderWarehouseId && (
                          <> &nbsp;·&nbsp; Lender Warehouse: <b>{warehouseObj?.name || item.lenderWarehouseId}</b></>
                        )}
                      </Typography>
                    </Box>
                    <Stack spacing={0.3} textAlign="right">
                      <Typography variant="body2">Loaned Qty: <b>{item.qty}</b></Typography>
                      <Typography variant="body2" color="success.main">Sold: <b>{item.soldQty || 0}</b></Typography>
                      <Typography variant="body2" color="info.main">Returned: <b>{item.returnedQty || 0}</b></Typography>
                    </Stack>
                  </Stack>
                </Box>
              );
            })}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)", mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Settlement</Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Total Due</Typography>
                <Typography fontWeight={700} color="error.main">{(bo.totalSettlementDue || 0).toFixed(2)}</Typography>
              </Stack>
              {profitData?.profitByBusiness && Object.entries(profitData.profitByBusiness).map(([shopId, profit]: any) => (
                <Stack key={shopId} direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    {shopId === myBusinessId ? "Your profit" : `Shop …${shopId.slice(-6)}`}
                  </Typography>
                  <Typography fontWeight={600} color="success.main">{(profit as number).toFixed(2)}</Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Actions</Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1.5}>
              {bo.status === "PENDING" && isLender && (
                <>
                  <Button variant="contained" color="success" fullWidth onClick={openApproveDialog}>
                    Approve Loan Request
                  </Button>
                  <Button variant="outlined" color="error" fullWidth onClick={handleReject} disabled={reject.isPending}>
                    Reject Request
                  </Button>
                </>
              )}
              {bo.status === "APPROVED" && isBorrower && (
                <Button variant="contained" fullWidth onClick={handleActivate} disabled={activate.isPending}>
                  Transfer Stock to My Warehouse
                </Button>
              )}
              {["ACTIVE", "PARTIALLY_RETURNED"].includes(bo.status) && isBorrower && (
                <>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={() => {
                      navigate("/sales/new", {
                        state: {
                          borrowOrderId: bo._id,
                          lenderBusinessId: bo.lenderBusinessId,
                          items: (bo.items || []).map((i: any) => {
                            const p = productMap.get(String(i.productId));
                            return {
                              productId: String(i.productId),
                              productName: i.productName || i.product?.name || p?.name || "",
                              qty: i.qty - (i.soldQty || 0) - (i.returnedQty || 0),
                              unitPrice: p?.salePrice || 0,
                              agreedUnitCost: i.agreedUnitCost || 0
                            };
                          }).filter((i: any) => i.qty > 0)
                        }
                      });
                    }}
                  >
                    Create Sales Order
                  </Button>
                  <Button variant="outlined" fullWidth onClick={() => {
                    const initial: Record<string, number> = {};
                    (bo.items || []).forEach((i: any) => { initial[String(i.productId)] = 0; });
                    setReturnQtys(initial);
                    setReturnDialog(true);
                  }}>
                    Return Stock to Lender
                  </Button>
                </>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Approve dialog — lender assigns warehouse per item */}
      <Dialog open={approveDialog} onClose={() => setApproveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Accept Lend Request</DialogTitle>
        <DialogContent sx={{ pt: "12px !important" }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Assign one of your warehouses to each item. Stock will be pulled from those warehouses when the borrower activates the order.
          </Typography>
          {(bo?.items || []).map((item: any) => {
            const product = productMap.get(String(item.productId));
            const productName = item.productName || item.product?.name || product?.name || `Product …${String(item.productId || "").slice(-6)}`;
            return (
              <Stack key={String(item.productId)} direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight={600}>{productName}</Typography>
                  <Typography variant="caption" color="text.secondary">Qty: {item.qty} &nbsp;·&nbsp; Agreed cost: {item.agreedUnitCost} / unit</Typography>
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
          <Button onClick={() => setApproveDialog(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleApprove} disabled={approve.isPending}>
            Accept & Assign Warehouses
          </Button>
        </DialogActions>
      </Dialog>

      {/* Return dialog */}
      <Dialog open={returnDialog} onClose={() => setReturnDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Return Items to Lender</DialogTitle>
        <DialogContent sx={{ pt: "12px !important" }}>
          {(bo?.items || []).map((item: any) => {
            const product = productMap.get(String(item.productId));
            const productName = item.productName || item.product?.name || product?.name || `Product …${String(item.productId || "").slice(-6)}`;
            const maxReturn = item.qty - (item.returnedQty || 0);
            return (
              <Stack key={String(item.productId)} direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Typography sx={{ flex: 1 }}>{productName}</Typography>
                <TextField
                  label={`Qty (max ${maxReturn})`}
                  type="number"
                  size="small"
                  sx={{ width: 130 }}
                  value={returnQtys[String(item.productId)] || 0}
                  onChange={(e) => setReturnQtys((prev) => ({
                    ...prev,
                    [String(item.productId)]: Math.min(Number(e.target.value), maxReturn)
                  }))}
                />
              </Stack>
            );
          })}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleReturn} disabled={returnBO.isPending}>
            Confirm Return
          </Button>
        </DialogActions>
      </Dialog>

      {confirmDialog}
    </Box>
  );
}
