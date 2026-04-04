import { Box, Button } from "@mui/material";
import TextField from "../components/CustomTextField";
import React from "react";
import { useCustomers, useDeleteCustomer } from "../hooks/useCustomers";
import DataTable from "../components/DataTable";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { Drawer } from "@mui/material";
import CustomerCreate from "./customers/CustomerCreate";
import CustomerEdit from "./customers/CustomerEdit";
import { useToast } from "../hooks/useToast";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import RowActionMenu from "../components/RowActionMenu";

export default function Customers({ showHeader = true }: { showHeader?: boolean } = {}) {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebouncedValue(search.trim());
  const { data, isLoading } = useCustomers({ page: page + 1, limit: rowsPerPage, search: debouncedSearch || undefined });
  const deleteCustomer = useDeleteCustomer();
  const navigate = useNavigate();
  const { notify } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();
  const [drawerState, setDrawerState] = React.useState<{ open: boolean; type: "new" | "edit" | null; id: string | null }>({
    open: false, type: null, id: null
  });

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
      {showHeader && <PageHeader title="Customers" actionLabel="Create Customer" onAction={() => setDrawerState({ open: true, type: "new", id: null })} />}
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
                  { label: "Edit", onClick: () => setDrawerState({ open: true, type: "edit", id: row._id }) },
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
      <Drawer
        anchor="right"
        open={drawerState.open}
        onClose={() => setDrawerState({ open: false, type: null, id: null })}
        sx={{ zIndex: 1300 }}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 600 },
            backdropFilter: "blur(16px)"
          }
        }}
      >
        {drawerState.type === "new" && (
          <CustomerCreate onSuccess={() => setDrawerState({ open: false, type: null, id: null })} onCancel={() => setDrawerState({ open: false, type: null, id: null })} />
        )}
        {drawerState.type === "edit" && drawerState.id && (
          <CustomerEdit explicitId={drawerState.id} onSuccess={() => setDrawerState({ open: false, type: null, id: null })} onCancel={() => setDrawerState({ open: false, type: null, id: null })} />
        )}
      </Drawer>
      {confirmDialog}
    </Box>
  );
}
