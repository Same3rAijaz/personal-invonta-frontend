import { Box, Button } from "@mui/material";
import React from "react";
import { useDeleteWarehouse, useWarehouses } from "../hooks/useWarehouses";
import DataTable from "../components/DataTable";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { useToast } from "../hooks/useToast";

export default function Warehouses() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const { data } = useWarehouses({ page: page + 1, limit: rowsPerPage });
  const deleteWarehouse = useDeleteWarehouse();
  const navigate = useNavigate();
  const { notify } = useToast();

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this warehouse?")) return;
    try {
      await deleteWarehouse.mutateAsync(id);
      notify("Warehouse deleted", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <Box>
      <PageHeader title="Warehouses" actionLabel="Create Warehouse" onAction={() => navigate("/warehouses/new")} />
      <DataTable
        columns={[
          { key: "name", label: "Name" },
          { key: "address", label: "Address" },
          { key: "isActive", label: "Active" },
          {
            key: "actions",
            label: "Actions",
            render: (row: any) => (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button size="small" onClick={() => navigate(`/warehouses/${row._id}/edit`)}>
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
