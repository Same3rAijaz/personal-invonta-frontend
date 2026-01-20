import { Box, Button } from "@mui/material";
import { api } from "../../api/client";
import { useDeleteSalesOrder, useSalesOrders } from "../../hooks/useSales";
import DataTable from "../../components/DataTable";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import { useCustomers } from "../../hooks/useCustomers";
import { useToast } from "../../hooks/useToast";

export default function SalesOrders() {
  const { data } = useSalesOrders();
  const deleteSO = useDeleteSalesOrder();
  const { data: customers } = useCustomers();
  const navigate = useNavigate();
  const customerMap = new Map((customers?.items || []).map((c: any) => [c._id, c.name]));
  const baseUrl = api.defaults.baseURL || "/api";
  const openInvoice = async (id: string, download: boolean) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      notify("Please sign in again", "error");
      return;
    }
    try {
      const url = `${baseUrl}/sales/sos/${id}/invoice${download ? "?download=1" : ""}`;
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
    }
  };
  const rows = (data?.items || []).map((so: any) => ({
    ...so,
    itemsCount: so.items?.length || 0,
    customerName: customerMap.get(so.customerId) || so.customerId
  }));
  const { notify } = useToast();

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this sales order?")) return;
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
              return (
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Button size="small" disabled={!canEdit} onClick={() => navigate(`/sales/${row._id}/edit`)}>
                    Edit
                  </Button>
                  <Button size="small" color="error" disabled={!canEdit} onClick={() => handleDelete(row._id)}>
                    Delete
                  </Button>
                  <Button size="small" onClick={() => openInvoice(row._id, false)}>
                    View Invoice
                  </Button>
                  <Button size="small" onClick={() => openInvoice(row._id, true)}>
                    Download
                  </Button>
                </Box>
              );
            }
          }
        ]}
        rows={rows}
      />
    </Box>
  );
}
