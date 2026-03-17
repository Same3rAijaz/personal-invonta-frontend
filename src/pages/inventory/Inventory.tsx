import { Box, TextField } from "@mui/material";
import React from "react";
import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import { useNavigate } from "react-router-dom";
import { useInventoryBalances } from "../../hooks/useInventory";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useProducts } from "../../hooks/useProducts";
import { useWarehouses } from "../../hooks/useWarehouses";
import RowActionMenu from "../../components/RowActionMenu";

export default function Inventory() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebouncedValue(search.trim());
  const { data, isLoading } = useInventoryBalances({ page: page + 1, limit: rowsPerPage, search: debouncedSearch || undefined });
  const { data: products } = useProducts({ page: 1, limit: 1000 });
  const { data: warehouses } = useWarehouses({ page: 1, limit: 1000 });
  const navigate = useNavigate();

  React.useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  return (
    <Box>
      <PageHeader title="Inventory" actionLabel="Create Inventory" onAction={() => navigate("/inventory/new")} />
      <DataTable
        columns={[
          { key: "productName", label: "Product" },
          { key: "warehouseName", label: "Warehouse" },
          { key: "qty", label: "Qty" },
          { key: "avgCost", label: "Avg Cost" },
          {
            key: "actions",
            label: "Actions",
            render: (row: any) => (
              <RowActionMenu
                actions={[
                  { label: "View Product", onClick: () => navigate(`/products/${row.productId}`) },
                  { label: "Receive", onClick: () => navigate(`/inventory/new?action=receive&productId=${row.productId}&warehouseId=${row.warehouseId}`) },
                  { label: "Issue", onClick: () => navigate(`/inventory/new?action=issue&productId=${row.productId}&warehouseId=${row.warehouseId}`) },
                  { label: "Transfer", onClick: () => navigate(`/inventory/new?action=transfer&productId=${row.productId}&warehouseId=${row.warehouseId}`) },
                  { label: "Adjust", onClick: () => navigate(`/inventory/new?action=adjust&productId=${row.productId}&warehouseId=${row.warehouseId}`) },
                  { label: "Stock Take", onClick: () => navigate(`/inventory/new?action=stocktake&productId=${row.productId}&warehouseId=${row.warehouseId}`) }
                ]}
              />
            )
          }
        ]}
        rows={(data?.items || []).map((row: any) => ({
          ...row,
          productName: products?.items?.find((p: any) => p._id === row.productId)?.name || row.productId,
          warehouseName: warehouses?.items?.find((w: any) => w._id === row.warehouseId)?.name || row.warehouseId
        }))}
        loading={isLoading}
        actions={
          <TextField
            size="small"
            placeholder="Search inventory"
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
