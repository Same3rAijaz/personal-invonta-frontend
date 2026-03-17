import { Box, Button, TextField } from "@mui/material";
import React from "react";
import { useCustomers, useDeleteCustomer } from "../hooks/useCustomers";
import DataTable from "../components/DataTable";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { useToast } from "../hooks/useToast";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import RowActionMenu from "../components/RowActionMenu";

export default function Customers() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebouncedValue(search.trim());
  const { data, isLoading } = useCustomers({ page: page + 1, limit: rowsPerPage, search: debouncedSearch || undefined });
  const deleteCustomer = useDeleteCustomer();
  const navigate = useNavigate();
  const { notify } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();

  React.useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  const handleDelete = async (id: string) => {
    if (!(await confirm({ title: "Delete Customer", message: "Are you sure you want to delete this customer?", confirmText: "Delete" }))) return;
    try {
      await deleteCustomer.mutateAsync(id);
      notify("Customer deleted", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <Box>
      <PageHeader title="Customers" actionLabel="Create Customer" onAction={() => navigate("/customers/new")} />
      <DataTable
        columns={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "address", label: "Address" },
          { key: "paymentTerms", label: "Terms" },
          { key: "isActive", label: "Active" },
          {
            key: "actions",
            label: "Actions",
            render: (row: any) => (
              <RowActionMenu
                actions={[
                  { label: "Edit", onClick: () => navigate(`/customers/${row._id}/edit`) },
                  { label: "Delete", danger: true, onClick: () => handleDelete(row._id) }
                ]}
              />
            )
          }
        ]}
        rows={data?.items || []}
        loading={isLoading}
        actions={
          <TextField
            size="small"
            placeholder="Search customers"
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
