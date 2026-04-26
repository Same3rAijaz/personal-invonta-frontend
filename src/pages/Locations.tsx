import { Box, Button, MenuItem } from "@mui/material";
import TextField from "../components/CustomTextField";
import React from "react";
import { useDeleteLocation, useLocations } from "../hooks/useLocations";
import DataTable from "../components/DataTable";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { Drawer } from "@mui/material";
import LocationCreate from "./locations/LocationCreate";
import LocationEdit from "./locations/LocationEdit";
import { useToast } from "../hooks/useToast";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import RowActionMenu from "../components/RowActionMenu";
import { useWarehouses } from "../hooks/useWarehouses";

export default function Locations() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const [search, setSearch] = React.useState("");
  const [warehouseFilter, setWarehouseFilter] = React.useState("");
  const debouncedSearch = useDebouncedValue(search.trim());
  const { data, isLoading } = useLocations({ page: page + 1, limit: rowsPerPage, search: debouncedSearch || undefined, warehouseId: warehouseFilter || undefined });
  const { data: warehouses } = useWarehouses({ page: 1, limit: 100 });
  const deleteLocation = useDeleteLocation();
  const navigate = useNavigate();
  const { notify } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();
  const [drawerState, setDrawerState] = React.useState<{ open: boolean; type: "new" | "edit" | null; id: string | null }>({ open: false, type: null, id: null });

  React.useEffect(() => {
    setPage(0);
  }, [debouncedSearch, warehouseFilter]);

  const handleDelete = async (id: string) => {
    if (!(await confirm({ title: "Delete Location", message: "Are you sure you want to delete this location? Child locations must be deleted first.", confirmText: "Delete" }))) return;
    try {
      await deleteLocation.mutateAsync(id);
      notify("Location deleted", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <Box>
      <PageHeader title="Locations" actionLabel="Create Location" onAction={() => setDrawerState({ open: true, type: "new", id: null })} />
      <DataTable
        columns={[
          { key: "name", label: "Name" },
          { key: "code", label: "Code" },
          { key: "warehouseId", label: "Warehouse", render: (row: any) => warehouses?.items?.find((w: any) => w._id === row.warehouseId)?.name || row.warehouseId },
          { key: "parentId", label: "Parent", render: (row: any) => row.parentId ? "Has Parent" : "Root Location" },
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
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              select
              size="small"
              label="Filter by Warehouse"
              value={warehouseFilter}
              onChange={(e: any) => setWarehouseFilter(e.target.value)}
              sx={{ minWidth: 180 }}
              SelectProps={{ displayEmpty: true }}
            >
              <MenuItem value="">All Warehouses</MenuItem>
              {(warehouses?.items || []).map((w: any) => (
                <MenuItem key={w._id} value={w._id}>{w.name}</MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              placeholder="Search locations"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ minWidth: 240 }}
            />
          </Box>
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
      
      <Drawer anchor="right" open={drawerState.open} onClose={() => setDrawerState({ open: false, type: null, id: null })} sx={{ zIndex: 1300 }} PaperProps={{ sx: { width: { xs: "100%", sm: 600 }, backdropFilter: "blur(16px)" } }}>
        {drawerState.type === "new" && <LocationCreate onSuccess={() => setDrawerState({ open: false, type: null, id: null })} onCancel={() => setDrawerState({ open: false, type: null, id: null })} />}
        {drawerState.type === "edit" && drawerState.id && <LocationEdit explicitId={drawerState.id} onSuccess={() => setDrawerState({ open: false, type: null, id: null })} onCancel={() => setDrawerState({ open: false, type: null, id: null })} />}
      </Drawer>
      {confirmDialog}
    </Box>
  );
}
