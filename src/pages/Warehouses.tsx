import { Box, Button } from "@mui/material";
import { useDeleteWarehouse, useWarehouses } from "../hooks/useWarehouses";
import DataTable from "../components/DataTable";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { useToast } from "../hooks/useToast";

export default function Warehouses() {
  const { data } = useWarehouses();
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
      />
    </Box>
  );
}
