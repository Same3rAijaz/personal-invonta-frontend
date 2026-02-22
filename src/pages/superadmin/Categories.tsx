import { Box, Button } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import { useDeleteCategory, useSuperAdminCategories } from "../../hooks/useCategories";
import { useToast } from "../../hooks/useToast";

export default function Categories() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const navigate = useNavigate();
  const { notify } = useToast();
  const { data } = useSuperAdminCategories({ page: page + 1, limit: rowsPerPage });
  const deleteCategory = useDeleteCategory();

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await deleteCategory.mutateAsync(id);
      notify("Category deleted", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <Box>
      <PageHeader title="Categories" actionLabel="Create Category" onAction={() => navigate("/superadmin/categories/new")} />
      <DataTable
        columns={[
          { key: "name", label: "Name" },
          { key: "slug", label: "Slug" },
          {
            key: "subcategories",
            label: "Sub Categories",
            render: (row: any) => row.subcategories?.map((x: any) => x.name).join(", ") || "-"
          },
          { key: "isActive", label: "Active" },
          {
            key: "actions",
            label: "Actions",
            render: (row: any) => (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button size="small" onClick={() => navigate(`/superadmin/categories/${row._id}/edit`)}>
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
