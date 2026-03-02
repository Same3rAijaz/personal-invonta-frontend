import { Box, Button, TextField } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import { useDeleteCategory, useSuperAdminCategories } from "../../hooks/useCategories";
import { useToast } from "../../hooks/useToast";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";

export default function Categories() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebouncedValue(search.trim());
  const navigate = useNavigate();
  const { notify } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();
  const { data, isLoading } = useSuperAdminCategories({ page: page + 1, limit: rowsPerPage, search: debouncedSearch || undefined });
  const deleteCategory = useDeleteCategory();

  React.useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  const handleDelete = async (id: string) => {
    if (!(await confirm({ title: "Delete Category", message: "Are you sure you want to delete this category?", confirmText: "Delete" }))) return;
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
          { key: "parent", label: "Parent", render: (row: any) => row.pathNames?.length > 1 ? row.pathNames[row.pathNames.length - 2] : "-" },
          { key: "path", label: "Hierarchy", render: (row: any) => (row.pathNames || []).join(" > ") || row.name },
          { key: "level", label: "Level" },
          { key: "slug", label: "Slug" },
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
        loading={isLoading}
        actions={
          <TextField
            size="small"
            placeholder="Search categories"
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
