import { Box, Chip, TextField, Typography } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";
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

  const rows = (data?.items || []).map((sr: any) => ({
    ...sr,
    itemsCount: sr.items?.length || 0
  }));

  return (
    <Box>
      <PageHeader title="Sales Returns" actionLabel="New Return" onAction={() => navigate("/sales/returns/new")} />
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
    </Box>
  );
}
