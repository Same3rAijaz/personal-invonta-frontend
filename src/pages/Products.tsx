import { Autocomplete, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";
import React from "react";
import { useDeleteProduct, useProductShareTargets, useProducts, useShareProduct } from "../hooks/useProducts";
import DataTable from "../components/DataTable";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { useToast } from "../hooks/useToast";

export default function Products() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const { data } = useProducts({ page: page + 1, limit: rowsPerPage });
  const deleteProduct = useDeleteProduct();
  const shareProduct = useShareProduct();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [shareDialog, setShareDialog] = React.useState<{ open: boolean; product: any | null }>({ open: false, product: null });
  const [targetSearch, setTargetSearch] = React.useState("");
  const [selectedTargets, setSelectedTargets] = React.useState<any[]>([]);
  const { data: shareTargets = [] } = useProductShareTargets(targetSearch || undefined);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this product?")) return;
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
          { key: "sku", label: "SKU" },
          { key: "barcode", label: "Barcode" },
          { key: "name", label: "Name" },
          { key: "category", label: "Category" },
          { key: "unit", label: "Unit" },
          { key: "costPrice", label: "Cost" },
          { key: "salePrice", label: "Sale" },
          { key: "reorderLevel", label: "Reorder" },
          { key: "visibility", label: "Visibility" },
          {
            key: "scope",
            label: "Scope",
            render: (row: any) => (
              <Chip
                size="small"
                label={row.isSharedWithMe ? "Shared with me" : "My product"}
                color={row.isSharedWithMe ? "secondary" : "primary"}
                variant="outlined"
              />
            )
          },
          {
            key: "owner",
            label: "Owner Shop",
            render: (row: any) => row.businessId?.name || "-"
          },
          { key: "isActive", label: "Active" },
          {
            key: "actions",
            label: "Actions",
            render: (row: any) => (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button size="small" disabled={row.isSharedWithMe} onClick={() => navigate(`/products/${row._id}/edit`)}>
                  Edit
                </Button>
                <Button size="small" disabled={row.isSharedWithMe} onClick={() => openShareDialog(row)}>
                  Share
                </Button>
                <Button size="small" color="error" disabled={row.isSharedWithMe} onClick={() => handleDelete(row._id)}>
                  Delete
                </Button>
              </Box>
            )
          }
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
            onChange={(_event, value) => setSelectedTargets(value)}
            onInputChange={(_event, value) => setTargetSearch(value)}
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
    </Box>
  );
}
