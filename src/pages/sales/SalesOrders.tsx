import { Box, Button, CircularProgress, FormControl, MenuItem, Select, TextField } from "@mui/material";
import React from "react";
import { api } from "../../api/client";
import { useDeleteSalesOrder, useSalesOrders } from "../../hooks/useSales";
import DataTable from "../../components/DataTable";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import { useCustomers } from "../../hooks/useCustomers";
import { useToast } from "../../hooks/useToast";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";

export default function SalesOrders() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const [search, setSearch] = React.useState("");
  const [invoiceSize, setInvoiceSize] = React.useState<"A4" | "A5" | "80mm">("A4");
  const [loadingInvoiceId, setLoadingInvoiceId] = React.useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search.trim());
  const { data, isLoading } = useSalesOrders({ page: page + 1, limit: rowsPerPage, search: debouncedSearch || undefined });
  const deleteSO = useDeleteSalesOrder();
  const { data: customers } = useCustomers({ page: 1, limit: 1000 });
  const navigate = useNavigate();
  const customerMap = new Map((customers?.items || []).map((c: any) => [c._id, c.name]));
  const baseUrl = api.defaults.baseURL || "/api";
  const { notify } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();

  const openInvoice = async (id: string, download: boolean) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      notify("Please sign in again", "error");
      return;
    }
    setLoadingInvoiceId(id + (download ? "-dl" : "-view"));
    try {
      const params = new URLSearchParams();
      if (download) params.set("download", "1");
      params.set("size", invoiceSize);
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
              const isViewLoading = loadingInvoiceId === row._id + "-view";
              const isDownloadLoading = loadingInvoiceId === row._id + "-dl";
              return (
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                  <Button size="small" disabled={!canEdit} onClick={() => navigate(`/sales/${row._id}/edit`)}>
                    Edit
                  </Button>
                  <Button size="small" color="error" disabled={!canEdit} onClick={() => handleDelete(row._id)}>
                    Delete
                  </Button>
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <Select
                      value={invoiceSize}
                      onChange={(e) => setInvoiceSize(e.target.value as any)}
                      variant="outlined"
                      sx={{ fontSize: 13 }}
                    >
                      <MenuItem value="A4">A4</MenuItem>
                      <MenuItem value="A5">A5</MenuItem>
                      <MenuItem value="80mm">Thermal Receipt (80mm)</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    size="small"
                    disabled={!!loadingInvoiceId}
                    onClick={() => openInvoice(row._id, false)}
                    startIcon={isViewLoading ? <CircularProgress size={14} /> : undefined}
                  >
                    {isViewLoading ? "Loading\u2026" : "View Invoice"}
                  </Button>
                  <Button
                    size="small"
                    disabled={!!loadingInvoiceId}
                    onClick={() => openInvoice(row._id, true)}
                    startIcon={isDownloadLoading ? <CircularProgress size={14} /> : undefined}
                  >
                    {isDownloadLoading ? "Loading\u2026" : "Download"}
                  </Button>
                </Box>
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
      {confirmDialog}
    </Box>
  );
}
