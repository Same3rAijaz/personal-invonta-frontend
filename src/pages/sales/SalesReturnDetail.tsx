import { Box, Chip, Divider, Grid, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import IconButton from "@mui/material/IconButton";
import InventoryIcon from "@mui/icons-material/Inventory2Outlined";
import RecyclingIcon from "@mui/icons-material/RecyclingOutlined";
import WarehouseIcon from "@mui/icons-material/WarehouseOutlined";
import ReceiptIcon from "@mui/icons-material/ReceiptLongOutlined";
import { useSalesReturn } from "../../hooks/useSalesReturns";
import { useProducts } from "../../hooks/useProducts";
import { useWarehouses } from "../../hooks/useWarehouses";

const dispositionConfig: Record<string, { label: string; color: "success" | "warning" | "error" | "default" }> = {
  RESTOCK: { label: "Restocked", color: "success" },
  RETURN_TO_LENDER: { label: "Return to Lender", color: "warning" },
  DAMAGED: { label: "Damaged / Write-off", color: "error" }
};

export default function SalesReturnDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: sr, isLoading } = useSalesReturn(id!);
  const { data: products } = useProducts({ page: 1, limit: 1000 });
  const { data: warehouses } = useWarehouses({ page: 1, limit: 1000 });

  const productMap = new Map((products?.items || []).map((p: any) => [String(p._id), p]));
  const warehouseMap = new Map((warehouses?.items || []).map((w: any) => [String(w._id), w]));

  if (isLoading) {
    return (
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <IconButton onClick={() => navigate("/sales/returns")}><ArrowBackIcon /></IconButton>
          <Skeleton width={220} height={36} />
        </Stack>
        <Skeleton variant="rounded" height={200} />
      </Box>
    );
  }

  if (!sr) {
    return (
      <Box sx={{ textAlign: "center", mt: 10 }}>
        <Typography variant="h6" color="text.secondary">Sales return not found.</Typography>
        <IconButton onClick={() => navigate("/sales/returns")} sx={{ mt: 2 }}><ArrowBackIcon /></IconButton>
      </Box>
    );
  }

  const warehouse = warehouseMap.get(String(sr.warehouseId));
  const totalItems = (sr.items || []).reduce((acc: number, i: any) => acc + (i.qty || 0), 0);

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate("/sales/returns")} size="small" sx={{ border: "1px solid", borderColor: "divider" }}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h5" fontWeight={700}>{sr.number}</Typography>
            <Chip label="Sales Return" color="primary" size="small" icon={<RecyclingIcon />} />
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {sr.createdAt ? new Date(sr.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : ""}
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={3}>
        {/* Left — Items */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 4px 24px rgba(15,23,42,0.07)" }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <InventoryIcon color="primary" />
              <Typography variant="subtitle1" fontWeight={700}>Returned Items</Typography>
              <Chip label={`${(sr.items || []).length} line${(sr.items || []).length !== 1 ? "s" : ""}`} size="small" sx={{ ml: "auto" }} />
            </Stack>
            <Divider sx={{ mb: 2 }} />

            {(sr.items || []).length === 0 && (
              <Typography color="text.secondary" textAlign="center" py={3}>No items recorded.</Typography>
            )}

            {(sr.items || []).map((item: any, idx: number) => {
              const product = productMap.get(String(item.productId));
              const productName = product?.name || `Product …${String(item.productId || "").slice(-6)}`;
              const disp = dispositionConfig[item.disposition] || { label: item.disposition, color: "default" as const };
              const lenderWarehouse = item.lenderWarehouseId ? warehouseMap.get(String(item.lenderWarehouseId)) : null;

              return (
                <Box
                  key={idx}
                  sx={{
                    py: 2,
                    px: 2,
                    mb: 1,
                    borderRadius: 2,
                    bgcolor: "action.hover",
                    border: "1px solid",
                    borderColor: "divider"
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ flex: 1 }}>
                      <Typography fontWeight={600}>{productName}</Typography>
                      {product?.sku && (
                        <Typography variant="caption" color="text.secondary">SKU: {product.sku}</Typography>
                      )}
                      {lenderWarehouse && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Lender warehouse: {lenderWarehouse.name}
                        </Typography>
                      )}
                    </Box>
                    <Stack alignItems="flex-end" spacing={0.5}>
                      <Typography variant="body2" fontWeight={700}>Qty: {item.qty}</Typography>
                      <Chip
                        label={disp.label}
                        color={disp.color}
                        size="small"
                        variant="outlined"
                      />
                    </Stack>
                  </Stack>
                </Box>
              );
            })}
          </Paper>
        </Grid>

        {/* Right — Summary */}
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            {/* Meta */}
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 4px 24px rgba(15,23,42,0.07)" }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <ReceiptIcon color="primary" />
                <Typography variant="subtitle1" fontWeight={700}>Summary</Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Return Number</Typography>
                  <Typography variant="body2" fontWeight={600}>{sr.number}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Original SO</Typography>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    sx={{ fontFamily: "monospace", fontSize: "0.72rem", cursor: "pointer", color: "primary.main" }}
                    onClick={() => navigate(`/sales`)}
                    title={String(sr.originalSalesOrderId)}
                  >
                    …{String(sr.originalSalesOrderId || "").slice(-8)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Total Units Returned</Typography>
                  <Typography variant="body2" fontWeight={700} color="primary.main">{totalItems}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Line Items</Typography>
                  <Typography variant="body2" fontWeight={600}>{(sr.items || []).length}</Typography>
                </Stack>
                {sr.notes && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>Notes</Typography>
                      <Typography variant="body2">{sr.notes}</Typography>
                    </Box>
                  </>
                )}
              </Stack>
            </Paper>

            {/* Warehouse */}
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 4px 24px rgba(15,23,42,0.07)" }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <WarehouseIcon color="primary" />
                <Typography variant="subtitle1" fontWeight={700}>Warehouse</Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Typography fontWeight={600}>{warehouse?.name || "—"}</Typography>
              {warehouse?.address && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{warehouse.address}</Typography>
              )}
            </Paper>

            {/* Disposition breakdown */}
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 4px 24px rgba(15,23,42,0.07)" }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Disposition Breakdown</Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1}>
                {Object.entries(dispositionConfig).map(([key, cfg]) => {
                  const count = (sr.items || []).filter((i: any) => i.disposition === key).length;
                  if (count === 0) return null;
                  return (
                    <Stack key={key} direction="row" justifyContent="space-between" alignItems="center">
                      <Chip label={cfg.label} color={cfg.color} size="small" variant="outlined" />
                      <Typography variant="body2" fontWeight={600}>{count} item{count !== 1 ? "s" : ""}</Typography>
                    </Stack>
                  );
                })}
              </Stack>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
