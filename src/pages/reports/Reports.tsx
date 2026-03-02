import { Box, Typography } from "@mui/material";
import { useReports } from "../../hooks/useReports";
import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";

export default function Reports() {
  const reports = useReports();

  return (
    <Box>
      <PageHeader title="Reports" />
      <Typography variant="subtitle1" sx={{ mt: 2 }}>Stock On Hand</Typography>
      <DataTable columns={[{ key: "productId", label: "Product" }, { key: "qty", label: "Qty" }]} rows={reports.stockOnHand.data || []} loading={reports.stockOnHand.isLoading} />

      <Typography variant="subtitle1" sx={{ mt: 3 }}>Low Stock</Typography>
      <DataTable columns={[{ key: "name", label: "Product" }, { key: "qty", label: "Qty" }]} rows={reports.lowStock.data || []} loading={reports.lowStock.isLoading} />
    </Box>
  );
}
