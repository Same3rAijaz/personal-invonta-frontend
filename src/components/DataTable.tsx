import React from "react";
import { Paper, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Box, Typography, TablePagination, Skeleton, Button, Menu, Stack, TextField, MenuItem } from "@mui/material";

type Column<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
};

type FilterOption = { label: string; value: string };
type FilterField =
  | { key: string; label: string; type?: "select" | "text"; options?: FilterOption[] }
  | { type: "numberRange"; label: string; minKey: string; maxKey: string; minLabel?: string; maxLabel?: string };

export default function DataTable<T extends { id?: string }>({
  columns,
  rows,
  title,
  subtitle,
  actions,
  page,
  rowsPerPage,
  total,
  loading,
  onPageChange,
  onRowsPerPageChange,
  filters,
  onFiltersChange,
  serverFiltering,
  filterFields
}: {
  columns: Column<T>[];
  rows: T[];
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  page?: number;
  rowsPerPage?: number;
  total?: number;
  loading?: boolean;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  filters?: Record<string, string>;
  onFiltersChange?: (filters: Record<string, string>) => void;
  serverFiltering?: boolean;
  filterFields?: FilterField[];
}) {
  const [filtersAnchor, setFiltersAnchor] = React.useState<null | HTMLElement>(null);
  const [localFilters, setLocalFilters] = React.useState<Record<string, string>>({});
  const [draftFilters, setDraftFilters] = React.useState<Record<string, string>>({});
  const columnFilters = filters || localFilters;
  const setColumnFilters = React.useCallback(
    (next: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => {
      const resolved = typeof next === "function" ? next(columnFilters) : next;
      if (onFiltersChange) {
        onFiltersChange(resolved);
        return;
      }
      setLocalFilters(resolved);
    },
    [columnFilters, onFiltersChange]
  );
  const showPagination = typeof page === "number" && typeof rowsPerPage === "number" && typeof total === "number";
  const safeCount = Math.max(0, Number(total || 0));
  const safeRowsPerPage = Math.max(1, Number(rowsPerPage || 1));
  const excludedFilterKeys = React.useMemo(
    () => new Set(["id", "_id", "actions", "thumbnail", "thumbnailUrl", "images", "image", "createdAt", "updatedAt"]),
    []
  );
  const autoFilterableColumns = React.useMemo(() => {
    return columns.filter((col) => {
      const key = String(col.key);
      if (!key || excludedFilterKeys.has(key)) return false;
      const values = Array.from(
        new Set(
          rows
            .map((row: any) => row?.[key])
            .filter((value) => value !== undefined && value !== null && value !== "")
            .map((value) => String(value))
        )
      );
      return values.length >= 2 && values.length <= 12;
    });
  }, [columns, rows, excludedFilterKeys]);
  const effectiveFilterFields: FilterField[] = React.useMemo(() => {
    if (filterFields && filterFields.length > 0) return filterFields;
    return autoFilterableColumns.map((col) => ({ key: String(col.key), label: col.label, type: "select" as const }));
  }, [filterFields, autoFilterableColumns]);
  const filteredRows = React.useMemo(() => {
    const activeEntries = Object.entries(columnFilters).filter(([, value]) => value !== "");
    if (activeEntries.length === 0) return rows;
    return rows.filter((row: any) =>
      activeEntries.every(([key, value]) => String(row?.[key] ?? "") === String(value))
    );
  }, [rows, columnFilters]);
  const hasActiveFilters = React.useMemo(
    () => Object.values(columnFilters).some((value) => value !== ""),
    [columnFilters]
  );
  const activeFilterCount = React.useMemo(
    () => Object.values(columnFilters).filter((value) => value !== "").length,
    [columnFilters]
  );
  const tableRows = serverFiltering ? rows : filteredRows;
  const effectiveCount = serverFiltering ? safeCount : (hasActiveFilters ? filteredRows.length : safeCount);
  const totalPages = Math.max(1, Math.ceil(effectiveCount / safeRowsPerPage));
  const lastPage = Math.max(0, totalPages - 1);
  const safePage = Math.min(Math.max(0, Number(page || 0)), lastPage);
  const handleOpenFilters = (event: React.MouseEvent<HTMLElement>) => {
    setDraftFilters(columnFilters);
    setFiltersAnchor(event.currentTarget);
  };
  const handleCloseFilters = () => {
    setFiltersAnchor(null);
  };
  const handleApplyFilters = () => {
    setColumnFilters(draftFilters);
    setFiltersAnchor(null);
  };
  const handleResetFilters = () => {
    setDraftFilters({});
    setColumnFilters({});
  };

  return (
    <Paper sx={{ borderRadius: 1, overflow: "hidden", width: "100%", maxWidth: "100%" }}>
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
          flexWrap: "wrap",
          borderBottom: "1px solid rgba(148,163,184,0.2)"
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {title || "Records"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {subtitle || `${total ?? rows.length} rows`}
          </Typography>
        </Box>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{
            ml: "auto",
            minWidth: 0,
            width: { xs: "100%", sm: "auto" },
            maxWidth: "100%",
            alignItems: { xs: "stretch", sm: "center" },
            "& .MuiFormControl-root": { width: { xs: "100%", sm: "auto" }, maxWidth: "100%" },
            "& .MuiInputBase-root": { maxWidth: "100%" }
          }}
        >
          {actions || null}
          {effectiveFilterFields.length > 0 ? (
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant={hasActiveFilters ? "contained" : "outlined"}
                onClick={handleOpenFilters}
                sx={{ whiteSpace: "nowrap" }}
              >
                {hasActiveFilters ? `Edit Filters (${activeFilterCount})` : "Filters"}
              </Button>
              {hasActiveFilters ? (
                <Button size="small" onClick={handleResetFilters}>
                  Reset
                </Button>
              ) : null}
            </Stack>
          ) : null}
        </Stack>
      </Box>
      <Menu
        anchorEl={filtersAnchor}
        open={Boolean(filtersAnchor)}
        onClose={() => setFiltersAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box sx={{ p: 1.5, width: 280, display: "flex", flexDirection: "column", gap: 1.2 }}>
          {effectiveFilterFields.map((field) => {
            if (field.type === "numberRange") {
              return (
                <Stack key={`${field.minKey}-${field.maxKey}`} spacing={1}>
                  <Typography variant="caption" color="text.secondary">
                    {field.label}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      size="small"
                      type="number"
                      label={field.minLabel || "Min"}
                      value={draftFilters[field.minKey] || ""}
                      onChange={(event) =>
                        setDraftFilters((prev) => ({ ...prev, [field.minKey]: String(event.target.value || "") }))
                      }
                    />
                    <TextField
                      size="small"
                      type="number"
                      label={field.maxLabel || "Max"}
                      value={draftFilters[field.maxKey] || ""}
                      onChange={(event) =>
                        setDraftFilters((prev) => ({ ...prev, [field.maxKey]: String(event.target.value || "") }))
                      }
                    />
                  </Stack>
                </Stack>
              );
            }

            const key = field.key;
            const selectedValue = draftFilters[key] || "";
            const derivedValues = Array.from(
              new Set(
                rows
                  .map((row: any) => row?.[key])
                  .filter((value) => value !== undefined && value !== null && value !== "")
                  .map((value) => String(value))
              )
            );
            const optionValues = (field.options && field.options.length > 0
              ? field.options.map((item) => item.value)
              : derivedValues);
            const finalValues = selectedValue && !optionValues.includes(selectedValue) ? [selectedValue, ...optionValues] : optionValues;
            const labelMap = new Map<string, string>(
              (field.options || []).map((item) => [item.value, item.label])
            );

            if (field.type === "text") {
              return (
                <TextField
                  key={key}
                  size="small"
                  label={field.label}
                  value={selectedValue}
                  onChange={(event) => {
                    const nextValue = String(event.target.value || "");
                    setDraftFilters((prev) => ({ ...prev, [key]: nextValue }));
                  }}
                />
              );
            }

            return (
              <TextField
                key={key}
                select
                size="small"
                label={field.label}
                value={selectedValue}
                onChange={(event) => {
                  const nextValue = String(event.target.value || "");
                  setDraftFilters((prev) => ({ ...prev, [key]: nextValue }));
                }}
              >
                <MenuItem value="">All</MenuItem>
                {finalValues.map((value) => (
                  <MenuItem key={`${key}-${value}`} value={value}>
                    {labelMap.get(value) || value}
                  </MenuItem>
                ))}
              </TextField>
            );
          })}
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button size="small" onClick={handleCloseFilters}>
              Cancel
            </Button>
            <Button size="small" onClick={handleResetFilters} disabled={!hasActiveFilters && Object.values(draftFilters).every((value) => !value)}>
              Reset
            </Button>
            <Button size="small" variant="contained" onClick={handleApplyFilters}>
              Apply
            </Button>
          </Stack>
        </Box>
      </Menu>

      <TableContainer sx={{ width: "100%", maxHeight: { xs: 420, md: 560 }, overflowX: "auto", overflowY: "auto" }}>
        <Table size="small" stickyHeader sx={{ minWidth: "100%", width: "max-content" }}>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={String(col.key)}
                  sx={{ fontWeight: 700, textTransform: "uppercase", fontSize: "0.72rem", letterSpacing: 0.6, whiteSpace: "nowrap" }}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, rowIdx) => (
                <TableRow key={`skeleton-${rowIdx}`}>
                  {columns.map((col) => (
                    <TableCell key={`skeleton-${rowIdx}-${String(col.key)}`}>
                      <Skeleton variant="text" width={rowIdx % 2 === 0 ? "70%" : "55%"} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : tableRows.length > 0 ? (
              tableRows.map((row, idx) => (
                <TableRow
                  key={row.id || idx}
                  sx={{
                    "&:nth-of-type(even)": { backgroundColor: "rgba(148,163,184,0.08)" },
                    "&:hover": { backgroundColor: "rgba(14,165,233,0.08)" }
                  }}
                >
                  {columns.map((col) => (
                    <TableCell key={String(col.key)} sx={{ whiteSpace: "nowrap" }}>
                      {col.render ? col.render(row) : String((row as any)[col.key] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Typography variant="body2" color="text.secondary">
                    No records found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {showPagination ? (
        <TablePagination
          component="div"
          count={effectiveCount}
          page={safePage}
          onPageChange={(_, nextPage) => onPageChange && onPageChange(nextPage)}
          rowsPerPage={safeRowsPerPage}
          onRowsPerPageChange={(event) => onRowsPerPageChange && onRowsPerPageChange(Number(event.target.value))}
          rowsPerPageOptions={[10, 20, 50, 100]}
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
          sx={{
            overflowX: "auto",
            "& .MuiTablePagination-toolbar": {
              flexWrap: "wrap",
              rowGap: 1.2,
              px: 2,
              justifyContent: "flex-end"
            },
            "& .MuiTablePagination-spacer": {
              display: "none"
            }
          }}
        />
      ) : null}
    </Paper>
  );
}
