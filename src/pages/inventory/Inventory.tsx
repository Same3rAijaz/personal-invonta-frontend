import { Box } from "@mui/material";
import React from "react";
import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import { useNavigate } from "react-router-dom";
import { useInventoryBalances } from "../../hooks/useInventory";

export default function Inventory() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const { data } = useInventoryBalances({ page: page + 1, limit: rowsPerPage });
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
