import { Autocomplete, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";
import React from "react";
import { useDeleteProduct, useProductShareTargets, useProducts, useShareProduct } from "../hooks/useProducts";
import DataTable from "../components/DataTable";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { useToast } from "../hooks/useToast";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import RowActionMenu from "../components/RowActionMenu";

export default function Products() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<Record<string, string>>({});
  const debouncedSearch = useDebouncedValue(search.trim());
  const { data, isLoading } = useProducts({
    page: page + 1,
    limit: rowsPerPage,
    search: debouncedSearch || undefined,
    filters
  });
  const deleteProduct = useDeleteProduct();
  const shareProduct = useShareProduct();
  const navigate = useNavigate();
  const { notify } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();
  const [shareDialog, setShareDialog] = React.useState<{ open: boolean; product: any | null }>({ open: false, product: null });
  const [targetSearch, setTargetSearch] = React.useState("");
  const [selectedTargets, setSelectedTargets] = React.useState<any[]>([]);
  const { data: shareTargets = [] } = useProductShareTargets(targetSearch || undefined, shareDialog.open);

  React.useEffect(() => {
    setPage(0);
  }, [debouncedSearch, filters]);

  const tableRows = React.useMemo(
    () =>
      (data?.items || []).map((row: any) => ({
        ...row,
        ownership: row.isSharedWithMe ? "OWNED_BY_OTHERS" : "OWNED_BY_ME"
      })),
    [data?.items]
  );

  const handleDelete = async (id: string) => {
    if (!(await confirm({ title: "Delete Product", message: "Are you sure you want to delete this product?", confirmText: "Delete" }))) return;
    try {
      await deleteProduct.mutateAsync(id);
      notify("Product deleted", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  const openShareDialog = (product: any) => {
    const options = shareTargets || [];
    const currentIds = new Set((product.sharedWithBusinessIds || []).map((id: string) => String(id)));
    const currentTargets = options.filter((item: any) => currentIds.has(String(item._id)));
    setShareDialog({ open: true, product });
    setSelectedTargets(currentTargets);
  };

  React.useEffect(() => {
    if (!shareDialog.open || !shareDialog.product) return;
    const options = shareTargets || [];
    const currentIds = new Set((shareDialog.product.sharedWithBusinessIds || []).map((id: string) => String(id)));
    setSelectedTargets(options.filter((item: any) => currentIds.has(String(item._id))));
  }, [shareTargets, shareDialog.open, shareDialog.product]);

  const handleSaveShare = async () => {
    if (!shareDialog.product?._id) return;
    try {
      await shareProduct.mutateAsync({
        id: shareDialog.product._id,
        businessIds: selectedTargets.map((item: any) => String(item._id))
      });
      notify("Inventory sharing updated", "success");
      setShareDialog({ open: false, product: null });
      setSelectedTargets([]);
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <Box>
      <PageHeader title="Products" actionLabel="Create Product" onAction={() => navigate("/products/new")} />
      <DataTable
        columns={[
          {
            key: "thumbnail",
            label: "Image",
            render: (row: any) =>
              row.thumbnailUrl ? (
                <img src={row.thumbnailUrl} alt={row.name} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6 }} />
              ) : (
                ""
              )
          },
          {
            key: "name",
            label: "Name",
            render: (row: any) => (
              <Button size="small" sx={{ px: 0, minWidth: 0 }} onClick={() => navigate(`/products/${row._id}`)}>
                {row.name}
              </Button>
            )
          },
          { key: "category", label: "Category" },
          { key: "unit", label: "Unit" },
          {
            key: "availableQuantity",
            label: "Quantity",
            render: (row: any) => row.availableQuantity ?? row.quantity ?? 0
          },
          { key: "salePrice", label: "Price" },
          { key: "visibility", label: "Visibility" },
          {
            key: "ownership",
            label: "Ownership",
            render: (row: any) => (row.isSharedWithMe ? "Owned by Others" : "Owned by Me")
          },
          {
            key: "actions",
            label: "Actions",
            render: (row: any) => (
              <RowActionMenu
                actions={[
                  { label: "View", onClick: () => navigate(`/products/${row._id}`) },
                  { label: "Edit", disabled: row.isSharedWithMe, onClick: () => navigate(`/products/${row._id}/edit`) },
                  { label: "Share", disabled: row.isSharedWithMe, onClick: () => openShareDialog(row) },
                  { label: "Delete", disabled: row.isSharedWithMe, danger: true, onClick: () => handleDelete(row._id) }
                ]}
              />
            )
          }
        ]}
        rows={tableRows}
        loading={isLoading}
        serverFiltering
        filters={filters}
        onFiltersChange={setFilters}
        filterFields={[
          { key: "category", label: "Category", type: "select" },
          { type: "numberRange", label: "Price Range", minKey: "minPrice", maxKey: "maxPrice", minLabel: "Min", maxLabel: "Max" },
          {
            key: "visibility",
            label: "Visibility",
            type: "select",
            options: [
              { label: "Private", value: "PRIVATE" },
              { label: "Public", value: "PUBLIC" }
            ]
          },
          {
            key: "ownership",
            label: "Ownership",
            type: "select",
            options: [
              { label: "Owned by Me", value: "OWNED_BY_ME" },
              { label: "Owned by Others", value: "OWNED_BY_OTHERS" }
            ]
          }
        ]}
        actions={
          <TextField
            size="small"
            placeholder="Search products"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{ width: { xs: "100%", sm: 260 } }}
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
      <Dialog open={shareDialog.open} onClose={() => setShareDialog({ open: false, product: null })} fullWidth maxWidth="sm">
        <DialogTitle>Share Inventory With Other Shop Owners</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select shops that should be able to view this inventory item.
          </Typography>
          <Autocomplete
            multiple
            options={shareTargets || []}
            value={selectedTargets}
            inputValue={targetSearch}
            onChange={(_event, value) => setSelectedTargets(value)}
            onInputChange={(_event, value, reason) => {
              if (reason === "input" || reason === "clear") {
                setTargetSearch(value);
              }
            }}
            isOptionEqualToValue={(option: any, value: any) => String(option._id) === String(value._id)}
            getOptionLabel={(option: any) =>
              `${option.name}${option.marketId?.name ? ` (${option.marketId.name})` : ""}${option.city ? ` - ${option.city}` : ""}`
            }
            renderTags={(value: any[], getTagProps) =>
              value.map((option: any, index: number) => (
                <Chip {...getTagProps({ index })} key={option._id} label={option.name} size="small" />
              ))
            }
            renderInput={(params) => <TextField {...params} label="Search shops" placeholder="Type shop name..." />}
          />
          <Stack spacing={0.5} sx={{ mt: 1.5 }}>
            {selectedTargets.map((target: any) => (
              <Typography key={target._id} variant="caption" color="text.secondary">
                {target.name} {target.contactPhone ? `• ${target.contactPhone}` : ""}
              </Typography>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialog({ open: false, product: null })}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveShare} disabled={shareProduct.isPending}>
            Save Sharing
          </Button>
        </DialogActions>
      </Dialog>
      {confirmDialog}
    </Box>
  );
}
