import { Box } from "@mui/material";
import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import { useNavigate } from "react-router-dom";
import { useInventoryBalances } from "../../hooks/useInventory";

export default function Inventory() {
  const { data } = useInventoryBalances();
  const navigate = useNavigate();

  return (
    <Box>
      <PageHeader title="Inventory" actionLabel="New Movement" onAction={() => navigate("/inventory/new")} />
      <DataTable
        columns={[
          { key: "productId", label: "Product" },
          { key: "warehouseId", label: "Warehouse" },
          { key: "locationId", label: "Location" },
          { key: "qty", label: "Qty" },
          { key: "avgCost", label: "Avg Cost" }
        ]}
        rows={data || []}
      />
    </Box>
  );
}