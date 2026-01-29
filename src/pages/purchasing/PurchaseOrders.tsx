import { Box, Button } from "@mui/material";
import React from "react";
import { useDeletePurchaseOrder, usePurchaseOrders } from "../../hooks/usePurchasing";
import DataTable from "../../components/DataTable";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import { useVendors } from "../../hooks/useVendors";
import { useToast } from "../../hooks/useToast";

export default function PurchaseOrders() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const { data } = usePurchaseOrders({ page: page + 1, limit: rowsPerPage });
  const deletePO = useDeletePurchaseOrder();
  const { data: vendors } = useVendors({ page: 1, limit: 1000 });
  const navigate = useNavigate();
  const vendorMap = new Map((vendors?.items || []).map((v: any) => [v._id, v.name]));
  const rows = (data?.items || []).map((po: any) => ({
    ...po,
    itemsCount: po.items?.length || 0,
    vendorName: vendorMap.get(po.vendorId) || po.vendorId
  }));
  const { notify } = useToast();

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this purchase order?")) return;
    try {
      await deletePO.mutateAsync(id);
      notify("Purchase order deleted", "success");
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
          { key: "itemsCount", label: "Items" },
          {
            key: "actions",
            label: "Actions",
            render: (row: any) => (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button size="small" disabled={row.status !== "DRAFT"} onClick={() => navigate(`/purchasing/${row._id}/edit`)}>
                  Edit
                </Button>
                <Button size="small" color="error" disabled={row.status !== "DRAFT"} onClick={() => handleDelete(row._id)}>
                  Delete
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
    </Box>
  );
}
