import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from "@mui/material";
import React from "react";
import { useApprovePurchaseOrder, useDeletePurchaseOrder, usePurchaseOrders, useReceivePurchaseOrder } from "../../hooks/usePurchasing";
import DataTable from "../../components/DataTable";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import { useVendors } from "../../hooks/useVendors";
import { useToast } from "../../hooks/useToast";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import RowActionMenu from "../../components/RowActionMenu";
import { useWarehouses } from "../../hooks/useWarehouses";
import { useProducts } from "../../hooks/useProducts";
import OrderItemsTable from "../../components/OrderItemsTable";

export default function PurchaseOrders() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebouncedValue(search.trim());
  const { data, isLoading } = usePurchaseOrders({ page: page + 1, limit: rowsPerPage, search: debouncedSearch || undefined });
  const deletePO = useDeletePurchaseOrder();
  const approvePO = useApprovePurchaseOrder();
  const receivePO = useReceivePurchaseOrder();
  const { data: vendors } = useVendors({ page: 1, limit: 1000 });
  const { data: warehouses } = useWarehouses({ page: 1, limit: 1000 });
  const { data: products } = useProducts({ page: 1, limit: 1000 });
  const navigate = useNavigate();
  const vendorMap = new Map((vendors?.items || []).map((v: any) => [v._id, v.name]));
  const productMap = new Map((products?.items || []).map((p: any) => [String(p._id), p.name]));
  const rows = (data?.items || []).map((po: any) => ({
    ...po,
    itemsCount: po.items?.length || 0,
    purchasedQuantity: (po.items || []).reduce((sum: number, item: any) => sum + Number(item.qty || 0), 0),
    vendorName: vendorMap.get(po.vendorId) || po.vendorId
  }));
  const { notify } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();
  const [approveDialog, setApproveDialog] = React.useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [approveWarehouseId, setApproveWarehouseId] = React.useState("");
  const [receiveDialog, setReceiveDialog] = React.useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [receiveWarehouseId, setReceiveWarehouseId] = React.useState("");

  React.useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  const handleDelete = async (id: string) => {
    if (!(await confirm({ title: "Delete Purchase Order", message: "Are you sure you want to delete this purchase order?", confirmText: "Delete" }))) return;
    try {
      await deletePO.mutateAsync(id);
      notify("Purchase order deleted", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  const handleApprovePurchaseOrder = async () => {
    if (!approveDialog.id || !approveWarehouseId) {
      notify("Select a warehouse before approving", "error");
      return;
    }
    try {
      await approvePO.mutateAsync({
        id: approveDialog.id,
        payload: {
          warehouseId: approveWarehouseId
        }
      });
      notify("Purchase order approved and inventory updated", "success");
      setApproveDialog({ open: false, id: null });
      setApproveWarehouseId("");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  const handleReceivePurchaseOrder = async () => {
    if (!receiveDialog.id || !receiveWarehouseId) {
      notify("Select a warehouse before receiving", "error");
      return;
    }
    try {
      await receivePO.mutateAsync({
        id: receiveDialog.id,
        payload: {
          warehouseId: receiveWarehouseId
        }
      });
      notify("Purchase order received and inventory updated", "success");
      setReceiveDialog({ open: false, id: null });
      setReceiveWarehouseId("");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <Box>
      <PageHeader title="Purchase Orders" actionLabel="Create PO" onAction={() => navigate("/purchasing/new")} />
      <DataTable
        columns={[
          { key: "number", label: "Number" },
          { key: "vendorName", label: "Vendor" },
          { key: "status", label: "Status" },
          {
            key: "items",
            label: "Item Details",
            render: (row: any) => <OrderItemsTable items={row.items} labelByProductId={productMap} />
          },
          { key: "itemsCount", label: "Items" },
          { key: "purchasedQuantity", label: "Purchase Qty" },
          {
            key: "actions",
            label: "Actions",
            render: (row: any) => (
              <RowActionMenu
                actions={[
                  { label: "Edit", disabled: row.status !== "DRAFT", onClick: () => navigate(`/purchasing/${row._id}/edit`) },
                  {
                    label: "Approve",
                    disabled: row.status !== "DRAFT",
                    onClick: () => {
                      setApproveDialog({ open: true, id: row._id });
                      setApproveWarehouseId("");
                    }
                  },
                  {
                    label: "Receive",
                    disabled: !["DRAFT", "APPROVED"].includes(row.status),
                    onClick: () => {
                      setReceiveDialog({ open: true, id: row._id });
                      setReceiveWarehouseId("");
                    }
                  },
                  { label: "Delete", danger: true, disabled: row.status !== "DRAFT", onClick: () => handleDelete(row._id) }
                ]}
              />
            )
          }
        ]}
        rows={rows}
        loading={isLoading}
        actions={
          <TextField
            size="small"
            placeholder="Search purchase orders"
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
      <Dialog open={approveDialog.open} onClose={() => setApproveDialog({ open: false, id: null })} fullWidth maxWidth="sm">
        <DialogTitle>Approve Purchase Order</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "12px !important" }}>
          <TextField
            select
            fullWidth
            label="Warehouse *"
            value={approveWarehouseId}
            onChange={(event) => setApproveWarehouseId(event.target.value)}
            helperText={(warehouses?.items || []).length === 0 ? "Create a warehouse first." : "Approval will also add the stock to inventory."}
          >
            {(warehouses?.items || []).map((item: any) => (
              <MenuItem key={item._id} value={item._id}>
                {item.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialog({ open: false, id: null })}>Cancel</Button>
          <Button variant="contained" onClick={handleApprovePurchaseOrder} disabled={approvePO.isPending}>
            Approve Order
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={receiveDialog.open} onClose={() => setReceiveDialog({ open: false, id: null })} fullWidth maxWidth="sm">
        <DialogTitle>Receive Purchase Order</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "12px !important" }}>
          <TextField
            select
            fullWidth
            label="Warehouse *"
            value={receiveWarehouseId}
            onChange={(event) => setReceiveWarehouseId(event.target.value)}
            helperText={(warehouses?.items || []).length === 0 ? "Create a warehouse first." : undefined}
          >
            {(warehouses?.items || []).map((item: any) => (
              <MenuItem key={item._id} value={item._id}>
                {item.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReceiveDialog({ open: false, id: null })}>Cancel</Button>
          <Button variant="contained" onClick={handleReceivePurchaseOrder} disabled={receivePO.isPending}>
            Receive Order
          </Button>
        </DialogActions>
      </Dialog>
      {confirmDialog}
    </Box>
  );
}
