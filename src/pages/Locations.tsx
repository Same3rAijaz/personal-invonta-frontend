import { Box, Button } from "@mui/material";
import React from "react";
import { useDeleteLocation, useLocations } from "../hooks/useLocations";
import { useWarehouses } from "../hooks/useWarehouses";
import { useToast } from "../hooks/useToast";
import DataTable from "../components/DataTable";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";

export default function Locations() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const { data } = useLocations({ page: page + 1, limit: rowsPerPage });
  const deleteLocation = useDeleteLocation();
  const { data: warehouses } = useWarehouses({ page: 1, limit: 1000 });
  const navigate = useNavigate();
  const warehouseMap = new Map((warehouses?.items || []).map((w: any) => [w._id, w.name]));
  const rows = (data?.items || []).map((loc: any) => ({
    ...loc,
    warehouseName: warehouseMap.get(loc.warehouseId) || loc.warehouseId
  }));
  const { notify } = useToast();

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this location?")) return;
    try {
      await deleteLocation.mutateAsync(id);
      notify("Location deleted", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <Box>
      <PageHeader title="Locations" actionLabel="Create Location" onAction={() => navigate("/locations/new")} />
      <DataTable
        columns={[
          { key: "warehouseName", label: "Warehouse" },
          { key: "code", label: "Code" },
          { key: "description", label: "Description" },
          { key: "isActive", label: "Active" },
          {
            key: "actions",
            label: "Actions",
            render: (row: any) => (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button size="small" onClick={() => navigate(`/locations/${row._id}/edit`)}>
                  Edit
                </Button>
                <Button size="small" color="error" onClick={() => handleDelete(row._id)}>
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
