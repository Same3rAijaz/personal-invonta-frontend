import { Box } from "@mui/material";
import TextField from "../../components/CustomTextField";;
import React from "react";
import { Drawer } from "@mui/material";
import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import InventoryCreate, { type InventoryInitialParams } from "./InventoryCreate";
import { useInventoryBalances } from "../../hooks/useInventory";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import RowActionMenu from "../../components/RowActionMenu";
import { useNavigate, useLocation } from "react-router-dom";

export default function Inventory() {
  const navigate = useNavigate();
  const location = useLocation();
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebouncedValue(search.trim());
  const { data, isLoading } = useInventoryBalances({ page: page + 1, limit: rowsPerPage, search: debouncedSearch || undefined });
  const [drawerState, setDrawerState] = React.useState<{ open: boolean; initialParams?: InventoryInitialParams }>({
    open: false
  });

  const openCreate = (initialParams?: InventoryInitialParams) => {
    setDrawerState({ open: true, initialParams });
  };

  const closeCreate = () => {
    setDrawerState({ open: false, initialParams: undefined });
  };

  React.useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("openCreate") !== "1") return;

    openCreate({
      action: params.get("action") || undefined,
      productId: params.get("productId") || undefined,
      warehouseId: params.get("warehouseId") || undefined
    });

    params.delete("openCreate");
    const nextSearch = params.toString();
    navigate({ pathname: "/inventory", search: nextSearch ? `?${nextSearch}` : "" }, { replace: true });
  }, [location.search, navigate]);

  const drawerKey = [
    drawerState.initialParams?.action || "receive",
    drawerState.initialParams?.productId || "",
    drawerState.initialParams?.warehouseId || ""
  ].join("-");

  return (
    <Box>
      <PageHeader title="Inventory" actionLabel="Create Inventory" onAction={() => openCreate()} />
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
                  {
                    label: "Receive",
                    onClick: () =>
                      openCreate({ action: "receive", productId: String(row.productId), warehouseId: String(row.warehouseId) })
                  },
                  {
                    label: "Issue",
                    onClick: () =>
                      openCreate({ action: "issue", productId: String(row.productId), warehouseId: String(row.warehouseId) })
                  },
                  {
                    label: "Transfer",
                    onClick: () =>
                      openCreate({ action: "transfer", productId: String(row.productId), warehouseId: String(row.warehouseId) })
                  },
                  {
                    label: "Adjust",
                    onClick: () =>
                      openCreate({ action: "adjust", productId: String(row.productId), warehouseId: String(row.warehouseId) })
                  },
                  {
                    label: "Stock Take",
                    onClick: () =>
                      openCreate({ action: "stocktake", productId: String(row.productId), warehouseId: String(row.warehouseId) })
                  }
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

      <Drawer
        anchor="right"
        open={drawerState.open}
        onClose={closeCreate}
        sx={{ zIndex: 1300 }}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 700, md: 800 },
            backdropFilter: "blur(16px)"
          }
        }}
      >
        {drawerState.open ? (
          <InventoryCreate
            key={drawerKey}
            initialParams={drawerState.initialParams}
            onSuccess={closeCreate}
            onCancel={closeCreate}
          />
        ) : null}
      </Drawer>
    </Box>
  );
}
