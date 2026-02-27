import { Box, Button, TextField } from "@mui/material";
import React from "react";
import { useDeleteVendor, useVendors } from "../hooks/useVendors";
import DataTable from "../components/DataTable";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { useToast } from "../hooks/useToast";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

export default function Vendors() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebouncedValue(search.trim());
  const { data } = useVendors({ page: page + 1, limit: rowsPerPage, search: debouncedSearch || undefined });
  const deleteVendor = useDeleteVendor();
  const navigate = useNavigate();
  const { notify } = useToast();

  React.useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this vendor?")) return;
    try {
      await deleteVendor.mutateAsync(id);
      notify("Vendor deleted", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <Box>
      <PageHeader title="Vendors" actionLabel="Create Vendor" onAction={() => navigate("/vendors/new")} />
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
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button size="small" onClick={() => navigate(`/vendors/${row._id}/edit`)}>
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
        actions={
          <TextField
            size="small"
            placeholder="Search vendors"
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
    </Box>
  );
}
