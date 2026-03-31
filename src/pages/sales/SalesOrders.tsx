import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from "@mui/material";
import React from "react";
import { api } from "../../api/client";
import { useConfirmSalesOrder, useDeleteSalesOrder, useSalesOrders, useShipSalesOrder } from "../../hooks/useSales";
import DataTable from "../../components/DataTable";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import { useCustomers } from "../../hooks/useCustomers";
import { useToast } from "../../hooks/useToast";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { useAuth } from "../../hooks/useAuth";
import RowActionMenu from "../../components/RowActionMenu";
import { useWarehouses } from "../../hooks/useWarehouses";

export default function SalesOrders() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const [search, setSearch] = React.useState("");
  const [loadingInvoiceId, setLoadingInvoiceId] = React.useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search.trim());
  const { data, isLoading } = useSalesOrders({ page: page + 1, limit: rowsPerPage, search: debouncedSearch || undefined });
  const deleteSO = useDeleteSalesOrder();
  const confirmSO = useConfirmSalesOrder();
  const shipSO = useShipSalesOrder();
  const { data: customers } = useCustomers({ page: 1, limit: 1000 });
  const { data: warehouses } = useWarehouses({ page: 1, limit: 1000 });
  const navigate = useNavigate();
  const customerMap = new Map((customers?.items || []).map((c: any) => [c._id, c.name]));
  const baseUrl = api.defaults.baseURL || "/api";
  const { notify } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();
  const { business } = useAuth();
  const [shipDialog, setShipDialog] = React.useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [shipWarehouseId, setShipWarehouseId] = React.useState("");
  const [shipLocationId, setShipLocationId] = React.useState("");

  const openInvoice = async (id: string, download: boolean) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      notify("Please sign in again", "error");
      return;
    }
    setLoadingInvoiceId(id + (download ? "-dl" : "-view"));
    try {
      const params = new URLSearchParams();
      if (download) {
        params.set("download", "1");
        params.set("size", "A4"); // Always A4 for downloads
      } else {
        params.set("size", (business as any)?.printSize || "A4"); // Business pref for print/view
      }
      const url = `${baseUrl}/sales/sos/${id}/invoice?${params.toString()}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error("Failed to load invoice");
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const fileName = `invoice-${id}.pdf`;
      if (download) {
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
      } else {
        window.open(blobUrl, "_blank");
      }
    } catch (err: any) {
      notify(err?.message || "Failed", "error");
    } finally {
      setLoadingInvoiceId(null);
    }
  };

  const rows = (data?.items || []).map((so: any) => ({
    ...so,
    itemsCount: so.items?.length || 0,
    customerName: customerMap.get(so.customerId) || so.customerId
  }));

  React.useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  const handleDelete = async (id: string) => {
    if (!(await confirm({ title: "Delete Sales Order", message: "Are you sure you want to delete this sales order?", confirmText: "Delete" }))) return;
    try {
      await deleteSO.mutateAsync(id);
      notify("Sales order deleted", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  const handleConfirmSalesOrder = async (id: string) => {
    try {
      await confirmSO.mutateAsync(id);
      notify("Sales order confirmed", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  const handleShipSalesOrder = async () => {
    if (!shipDialog.id || !shipWarehouseId) {
      notify("Select a warehouse before shipping", "error");
      return;
    }
    try {
      await shipSO.mutateAsync({
        id: shipDialog.id,
        payload: {
          warehouseId: shipWarehouseId,
          locationId: shipLocationId || undefined
        }
      });
      notify("Sales order shipped and inventory updated", "success");
      setShipDialog({ open: false, id: null });
      setShipWarehouseId("");
      setShipLocationId("");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <Box>
      <PageHeader title="Sales Orders" actionLabel="Create SO" onAction={() => navigate("/sales/new")} />
      <DataTable
        columns={[
          { key: "number", label: "Number" },
          { key: "customerName", label: "Customer" },
          { key: "status", label: "Status" },
          { key: "itemsCount", label: "Items" },
          {
            key: "actions",
            label: "Actions",
            render: (row: any) => {
              const canEdit = row.status === "DRAFT";
              const canConfirm = row.status === "DRAFT";
              const canShip = row.status === "CONFIRMED";
              const isViewLoading = loadingInvoiceId === row._id + "-view";
              const isDownloadLoading = loadingInvoiceId === row._id + "-dl";
              return (
                <RowActionMenu
                  actions={[
                    { label: "Edit", disabled: !canEdit, onClick: () => navigate(`/sales/${row._id}/edit`) },
                    { label: "Confirm", disabled: !canConfirm, onClick: () => handleConfirmSalesOrder(row._id) },
                    {
                      label: "Ship",
                      disabled: !canShip,
                      onClick: () => {
                        setShipDialog({ open: true, id: row._id });
                        setShipWarehouseId("");
                        setShipLocationId("");
                      }
                    },
                    {
                      label: isViewLoading ? "Loading invoice..." : "View Invoice",
                      disabled: !!loadingInvoiceId,
                      onClick: () => openInvoice(row._id, false)
                    },
                    {
                      label: isDownloadLoading ? "Loading download..." : "Download Invoice",
                      disabled: !!loadingInvoiceId,
                      onClick: () => openInvoice(row._id, true)
                    },
                    {
                      label: "Create Return",
                      disabled: row.status !== "SHIPPED" && row.status !== "INVOICED",
                      onClick: () => navigate(`/sales/returns/new?soId=${row._id}`)
                    },
                    { label: "Delete", danger: true, disabled: !canEdit, onClick: () => handleDelete(row._id) }
                  ]}
                />
              );
            }
          }
        ]}
        rows={rows}
        loading={isLoading}
        actions={
          <TextField
            size="small"
            placeholder="Search sales orders"
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
      <Dialog open={shipDialog.open} onClose={() => setShipDialog({ open: false, id: null })} fullWidth maxWidth="sm">
        <DialogTitle>Ship Sales Order</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "12px !important" }}>
          <TextField
            select
            fullWidth
            label="Warehouse *"
            value={shipWarehouseId}
            onChange={(event) => setShipWarehouseId(event.target.value)}
            helperText={(warehouses?.items || []).length === 0 ? "Create a warehouse first." : undefined}
          >
            {(warehouses?.items || []).map((item: any) => (
              <MenuItem key={item._id} value={item._id}>
                {item.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Location ID"
            value={shipLocationId}
            onChange={(event) => setShipLocationId(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShipDialog({ open: false, id: null })}>Cancel</Button>
          <Button variant="contained" onClick={handleShipSalesOrder} disabled={shipSO.isPending}>
            Ship Order
          </Button>
        </DialogActions>
      </Dialog>
      {confirmDialog}
    </Box>
  );
}
