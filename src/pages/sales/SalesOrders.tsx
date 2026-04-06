import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Drawer } from "@mui/material";
import TextField from "../../components/CustomTextField";
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
import { useProducts } from "../../hooks/useProducts";
import OrderItemsTable from "../../components/OrderItemsTable";
import SalesOrderCreate from "./SalesOrderCreate";
import SalesOrderEdit from "./SalesOrderEdit";
import SalesReturnCreate from "./SalesReturnCreate";

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
  const { data: products } = useProducts({ page: 1, limit: 1000 });
  const navigate = useNavigate();
  const customerMap = new Map<string, string>((customers?.items || []).map((c: any) => [String(c._id), String(c.name)]));
  const productMap = new Map<string, string>((products?.items || []).map((p: any) => [String(p._id), String(p.name)]));
  const baseUrl = api.defaults.baseURL || "/api";
  const { notify } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();
  const [drawerState, setDrawerState] = React.useState<{ open: boolean; type: "new" | "edit" | "return" | null; id: string | null }>({ open: false, type: null, id: null });
  const { business } = useAuth();

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
    salesQuantity: (so.items || []).reduce((sum: number, item: any) => sum + Number(item.qty || 0), 0),
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

  const handleShipSalesOrder = async (id: string) => {
    try {
      await shipSO.mutateAsync({ id });
      notify("Sales order completed and inventory updated", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <Box>
      <PageHeader title="Sales Orders" actionLabel="Create SO" onAction={() => setDrawerState({ open: true, type: "new", id: null })} />
      <DataTable
        columns={[
          { key: "number", label: "Number" },
          { key: "customerName", label: "Customer" },
          { key: "status", label: "Status" },
          {
            key: "items",
            label: "Item Details",
            render: (row: any) => <OrderItemsTable items={row.items} labelByProductId={productMap} />
          },
          { key: "itemsCount", label: "Items" },
          { key: "salesQuantity", label: "Quantity" },
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
                    { label: "Edit", disabled: !canEdit, onClick: () => setDrawerState({ open: true, type: "edit", id: row._id }) },
                    { label: "Confirm", disabled: !canConfirm, onClick: () => handleConfirmSalesOrder(row._id) },
                    {
                      label: "Complete",
                      disabled: !canShip,
                      onClick: () => handleShipSalesOrder(row._id)
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
                      onClick: () => setDrawerState({ open: true, type: "return", id: row._id })
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
            onChange={(event: any) => setSearch(event.target.value)}
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

      <Drawer anchor="right" open={drawerState.open} onClose={() => setDrawerState({ open: false, type: null, id: null })} sx={{ zIndex: 1300 }} PaperProps={{ sx: { width: { xs: "100%", sm: 700, md: 800 }, backdropFilter: "blur(16px)" } }}>
        {drawerState.type === "new" && <SalesOrderCreate onSuccess={() => setDrawerState({ open: false, type: null, id: null })} onCancel={() => setDrawerState({ open: false, type: null, id: null })} />}
        {drawerState.type === "edit" && drawerState.id && <SalesOrderEdit explicitId={drawerState.id} onSuccess={() => setDrawerState({ open: false, type: null, id: null })} onCancel={() => setDrawerState({ open: false, type: null, id: null })} />}
        {drawerState.type === "return" && drawerState.id && <SalesReturnCreate defaultSoId={drawerState.id} onSuccess={() => setDrawerState({ open: false, type: null, id: null })} onCancel={() => setDrawerState({ open: false, type: null, id: null })} />}
      </Drawer>
      {confirmDialog}
    </Box>
  );
}
