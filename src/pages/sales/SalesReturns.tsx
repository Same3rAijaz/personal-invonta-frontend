import { Box, Chip, Typography } from "@mui/material";
import TextField from "../../components/CustomTextField";;
import React from "react";
import { useNavigate } from "react-router-dom";
import { Drawer } from "@mui/material";
import SalesReturnCreate from "./SalesReturnCreate";
import { useSalesReturns } from "../../hooks/useSalesReturns";
import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import RowActionMenu from "../../components/RowActionMenu";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

export default function SalesReturns() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const { data, isLoading } = useSalesReturns({ page: page + 1, limit: rowsPerPage });
  const navigate = useNavigate();
  const [drawerState, setDrawerState] = React.useState<{ open: boolean; type: "new" | null; defaultSoId: string }>({ open: false, type: null, defaultSoId: "" });

  const rows = (data?.items || []).map((sr: any) => ({
    ...sr,
    itemsCount: sr.items?.length || 0
  }));

  return (
    <Box>
      <PageHeader title="Sales Returns" actionLabel="New Return" onAction={() => setDrawerState({ open: true, type: "new", defaultSoId: "" })} />
      <DataTable
        columns={[
          { key: "number", label: "Number" },
          { key: "originalSalesOrderId", label: "Original SO", render: (row: any) => <Typography variant="body2">{row.originalSalesOrderId}</Typography> },
          { key: "itemsCount", label: "Items" },
          {
            key: "actions",
            label: "Actions",
            render: (row: any) => (
              <RowActionMenu
                actions={[
                  { label: "View Detail", onClick: () => navigate(`/sales/returns/${row._id}`) }
                ]}
              />
            )
          }
        ]}
        rows={rows}
        loading={isLoading}
        page={page}
        rowsPerPage={rowsPerPage}
        total={data?.total || 0}
        onPageChange={setPage}
        onRowsPerPageChange={(value) => { setRowsPerPage(value); setPage(0); }}
      />

      <Drawer anchor="right" open={drawerState.open} onClose={() => setDrawerState({ open: false, type: null, defaultSoId: "" })} sx={{ zIndex: 1300 }} PaperProps={{ sx: { width: { xs: "100%", sm: 700, md: 800 }, backdropFilter: "blur(16px)" } }}>
        {drawerState.type === "new" && (
          <SalesReturnCreate 
            defaultSoId={drawerState.defaultSoId} 
            onSuccess={() => setDrawerState({ open: false, type: null, defaultSoId: "" })} 
            onCancel={() => setDrawerState({ open: false, type: null, defaultSoId: "" })} 
          />
        )}
      </Drawer>
    </Box>
  );
}
