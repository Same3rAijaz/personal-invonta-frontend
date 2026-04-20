import { Box, Button, Chip, CircularProgress, Divider, Drawer, IconButton, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
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
import { useProducts } from "../../hooks/useProducts";
import SalesOrderCreate from "./SalesOrderCreate";
import SalesOrderEdit from "./SalesOrderEdit";
import SalesReturnCreate from "./SalesReturnCreate";

export default function SalesOrders() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const [search, setSearch] = React.useState("");
  const [loadingInvoiceId, setLoadingInvoiceId] = React.useState<string | null>(null);
  const [receiptOrder, setReceiptOrder] = React.useState<any | null>(null);
  const debouncedSearch = useDebouncedValue(search.trim());
  const { data, isLoading } = useSalesOrders({ page: page + 1, limit: rowsPerPage, search: debouncedSearch || undefined });
  const deleteSO = useDeleteSalesOrder();
  const confirmSO = useConfirmSalesOrder();
  const shipSO = useShipSalesOrder();
  const { data: customers } = useCustomers({ page: 1, limit: 1000 });
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
            label: "Items",
            render: (row: any) => (
              <Button
                size="small"
                variant="outlined"
                startIcon={<ReceiptLongIcon fontSize="small" />}
                onClick={() => setReceiptOrder(row)}
                sx={{ textTransform: "none", borderRadius: 2, fontSize: "0.78rem" }}
              >
                Show Items
              </Button>
            )
          },
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

      {/* Receipt side drawer */}
      <Drawer anchor="right" open={!!receiptOrder} onClose={() => setReceiptOrder(null)} sx={{ zIndex: 1400 }} PaperProps={{ sx: { width: { xs: "100%", sm: 500 }, display: "flex", flexDirection: "column" } }}>
        {receiptOrder && (() => {
          const grandTotal = (receiptOrder.items || []).reduce((sum: number, item: any) => sum + Number(item.qty || 0) * Number(item.unitPrice || 0), 0);
          const statusColor: Record<string, "default" | "warning" | "success" | "info" | "error"> = {
            DRAFT: "warning", CONFIRMED: "info", SHIPPED: "success", INVOICED: "success", CANCELLED: "error"
          };
          return (
            <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>

              {/* Header */}
              <Box sx={{ px: 3, pt: 2.5, pb: 2, borderBottom: "1px solid", borderColor: "divider" }}>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                  <Box>
                    <Typography variant="overline" color="text.disabled" sx={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: 2, mb: 0.3, display: "block" }}>Sales Receipt</Typography>
                    <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.2 }}>{receiptOrder.number}</Typography>
                    <Stack direction="row" spacing={1} alignItems="center" mt={0.6}>
                      <Chip label={receiptOrder.status} color={statusColor[receiptOrder.status] || "default"} size="small" sx={{ fontWeight: 700, fontSize: "0.68rem", height: 20 }} />
                      {receiptOrder.createdAt && <Typography variant="caption" color="text.secondary">{new Date(receiptOrder.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</Typography>}
                    </Stack>
                  </Box>
                  <IconButton size="small" onClick={() => setReceiptOrder(null)}><CloseIcon fontSize="small" /></IconButton>
                </Stack>
              </Box>

              {/* Bill To */}
              <Box sx={{ px: 3, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                <Typography variant="overline" color="text.disabled" sx={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: 1.5, display: "block", mb: 0.3 }}>Bill To</Typography>
                <Typography variant="body1" fontWeight={600} color="text.primary">{customerMap.get(receiptOrder.customerId) || receiptOrder.customerId}</Typography>
              </Box>

              {/* Items table */}
              <Box sx={{ flex: 1, overflow: "auto" }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {["#", "Product", "Qty", "Price", "Total"].map((h, i) => (
                        <TableCell key={h} align={i > 1 ? "right" : "left"} sx={{ fontWeight: 700, fontSize: "0.72rem", color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5, py: 1, bgcolor: "action.hover", borderBottom: "2px solid", borderColor: "divider" }}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(receiptOrder.items || []).map((item: any, idx: number) => {
                      const lineTotal = Number(item.qty || 0) * Number(item.unitPrice || 0);
                      return (
                        <TableRow key={idx} hover sx={{ "& td": { borderBottom: "1px solid", borderColor: "divider" }, "&:last-child td": { borderBottom: 0 } }}>
                          <TableCell sx={{ color: "text.disabled", fontSize: "0.78rem", width: 28 }}>{idx + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 500, color: "text.primary", fontSize: "0.88rem" }}>{productMap.get(String(item.productId)) || item.productId}</TableCell>
                          <TableCell align="right" sx={{ color: "text.secondary", fontSize: "0.88rem" }}>{item.qty}</TableCell>
                          <TableCell align="right" sx={{ color: "text.secondary", fontSize: "0.88rem" }}>{Number(item.unitPrice || 0).toLocaleString()}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: "text.primary", fontSize: "0.88rem" }}>{lineTotal.toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>

              {/* Totals */}
              <Box sx={{ px: 3, py: 2, borderTop: "2px solid", borderColor: "divider" }}>
                <Stack direction="row" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2" color="text.secondary">Subtotal ({receiptOrder.items?.length || 0} items)</Typography>
                  <Typography variant="body2" color="text.secondary">{grandTotal.toLocaleString()}</Typography>
                </Stack>
                <Divider sx={{ my: 1 }} />
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="subtitle1" fontWeight={800} color="text.primary">Total</Typography>
                  <Typography variant="subtitle1" fontWeight={800} color="text.primary">{grandTotal.toLocaleString()}</Typography>
                </Stack>
              </Box>

              {/* Actions */}
              <Box sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider" }}>
                <Stack direction="row" spacing={1.5}>
                  <Button fullWidth variant="outlined" disabled={!!loadingInvoiceId} onClick={() => openInvoice(receiptOrder._id, false)} sx={{ textTransform: "none", borderRadius: 2 }}>
                    {loadingInvoiceId === receiptOrder._id + "-view" ? <CircularProgress size={14} sx={{ mr: 1 }} /> : null}
                    View PDF
                  </Button>
                  <Button fullWidth variant="contained" disabled={!!loadingInvoiceId} onClick={() => openInvoice(receiptOrder._id, true)} sx={{ textTransform: "none", borderRadius: 2 }}>
                    {loadingInvoiceId === receiptOrder._id + "-dl" ? <CircularProgress size={14} sx={{ mr: 1 }} /> : null}
                    Download Invoice
                  </Button>
                </Stack>
              </Box>

            </Box>
          );
        })()}
      </Drawer>
    </Box>
  );
}
