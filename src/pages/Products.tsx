import { Box, Button } from "@mui/material";
import React from "react";
import { useDeleteProduct, useProducts } from "../hooks/useProducts";
import DataTable from "../components/DataTable";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { useToast } from "../hooks/useToast";

export default function Products() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const { data } = useProducts({ page: page + 1, limit: rowsPerPage });
  const deleteProduct = useDeleteProduct();
  const navigate = useNavigate();
  const { notify } = useToast();

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await deleteProduct.mutateAsync(id);
      notify("Product deleted", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <Box>
      <PageHeader title="Products" actionLabel="Create Product" onAction={() => navigate("/products/new")} />
      <DataTable
        columns={[
          {
            key: "thumbnail",
            label: "Image",
            render: (row: any) =>
              row.thumbnailUrl ? (
                <img src={row.thumbnailUrl} alt={row.name} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6 }} />
              ) : (
                ""
              )
          },
          { key: "sku", label: "SKU" },
          { key: "barcode", label: "Barcode" },
          { key: "name", label: "Name" },
          { key: "category", label: "Category" },
          { key: "unit", label: "Unit" },
          { key: "costPrice", label: "Cost" },
          { key: "salePrice", label: "Sale" },
          { key: "reorderLevel", label: "Reorder" },
          { key: "visibility", label: "Visibility" },
          { key: "isActive", label: "Active" },
          {
            key: "actions",
            label: "Actions",
            render: (row: any) => (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button size="small" onClick={() => navigate(`/products/${row._id}/edit`)}>
                  Edit
                </Button>
                <Button size="small" color="error" onClick={() => handleDelete(row._id)}>
                  Delete
                </Button>
              </Box>
            )
          }
        ]}
        rows={data?.items || []}
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
