import React from "react";
import { Paper, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Box, Typography, TablePagination } from "@mui/material";

type Column<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
};

export default function DataTable<T extends { id?: string }>({
  columns,
  rows,
  title,
  subtitle,
  actions,
  page,
  rowsPerPage,
  total,
  onPageChange,
  onRowsPerPageChange
}: {
  columns: Column<T>[];
  rows: T[];
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  page?: number;
  rowsPerPage?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
}) {
  const showPagination = typeof page === "number" && typeof rowsPerPage === "number" && typeof total === "number";
  return (
    <Paper sx={{ borderRadius: 1, overflow: "hidden" }}>
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(148,163,184,0.2)"
        }}
      >
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {title || "Records"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {subtitle || `${total ?? rows.length} rows`}
          </Typography>
        </Box>
        {actions ? <Box>{actions}</Box> : null}
      </Box>
      <TableContainer>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={String(col.key)} sx={{ fontWeight: 700, textTransform: "uppercase", fontSize: "0.72rem", letterSpacing: 0.6 }}>
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow
                key={row.id || idx}
                sx={{
                  "&:nth-of-type(even)": { backgroundColor: "rgba(148,163,184,0.08)" },
                  "&:hover": { backgroundColor: "rgba(14,165,233,0.08)" }
                }}
              >
                {columns.map((col) => (
                  <TableCell key={String(col.key)}>
                    {col.render ? col.render(row) : String((row as any)[col.key] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {showPagination ? (
        <TablePagination
          component="div"
          count={total as number}
          page={page as number}
          onPageChange={(_, nextPage) => onPageChange && onPageChange(nextPage)}
          rowsPerPage={rowsPerPage as number}
          onRowsPerPageChange={(event) => onRowsPerPageChange && onRowsPerPageChange(Number(event.target.value))}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      ) : null}
    </Paper>
  );
}
