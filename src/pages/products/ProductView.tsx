import {
  Box, Button, Chip, Divider, Grid, Paper, Skeleton,
  Stack, Typography, Avatar, Tooltip
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/EditOutlined";
import IconButton from "@mui/material/IconButton";
import AttachMoneyIcon from "@mui/icons-material/AttachMoneyOutlined";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCartOutlined";
import InventoryIcon from "@mui/icons-material/Inventory2Outlined";
import QrCodeIcon from "@mui/icons-material/QrCode2Outlined";
import CategoryIcon from "@mui/icons-material/CategoryOutlined";
import ScaleIcon from "@mui/icons-material/ScaleOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmberOutlined";
import { useProduct } from "../../hooks/useProducts";

function StatCard({ icon, label, value, color = "primary.main", bg = "rgba(99,102,241,0.07)" }: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  color?: string;
  bg?: string;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, border: "1px solid", borderColor: "divider", flex: 1 }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ width: 40, height: 40, borderRadius: 2, background: bg, display: "flex", alignItems: "center", justifyContent: "center", color }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
          <Typography fontWeight={700} variant="body1">{value}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

export default function ProductView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(id);

  if (isLoading) {
    return (
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <Skeleton variant="circular" width={36} height={36} />
          <Skeleton width={200} height={36} />
        </Stack>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}><Skeleton variant="rounded" height={340} /></Grid>
          <Grid item xs={12} md={8}><Skeleton variant="rounded" height={340} /></Grid>
        </Grid>
      </Box>
    );
  }

  if (!product) {
    return (
      <Box sx={{ textAlign: "center", mt: 10 }}>
        <Typography variant="h6" color="text.secondary">Product not found.</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/products")} sx={{ mt: 2 }}>Back to Products</Button>
      </Box>
    );
  }

  const availableQty = product.availableQuantity ?? product.quantity ?? 0;
  const isLowStock = product.reorderLevel != null && availableQty <= product.reorderLevel;
  const images: string[] = product.images || [];
  const thumbnailUrl: string = product.thumbnailUrl || images[0] || "";
  const margin = product.costPrice && product.salePrice
    ? (((product.salePrice - product.costPrice) / product.salePrice) * 100).toFixed(1)
    : null;

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconButton onClick={() => navigate("/products")} size="small" sx={{ border: "1px solid", borderColor: "divider" }}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box>
            <Typography variant="h5" fontWeight={800} lineHeight={1.2}>{product.name}</Typography>
            {product.sku && (
              <Typography variant="caption" color="text.secondary">SKU: {product.sku}</Typography>
            )}
          </Box>
        </Stack>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/products/${product._id}/edit`)}
          sx={{ borderRadius: 2 }}
        >
          Edit
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {/* Left column — image + gallery */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ borderRadius: 3, overflow: "hidden", boxShadow: "0 4px 24px rgba(15,23,42,0.08)", mb: 2 }}>
            {thumbnailUrl ? (
              <Box
                component="img"
                src={thumbnailUrl}
                alt={product.name}
                sx={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" }}
              />
            ) : (
              <Box sx={{
                width: "100%", aspectRatio: "1/1", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                background: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)"
              }}>
                <InventoryIcon sx={{ fontSize: 64, color: "text.disabled", mb: 1 }} />
                <Typography variant="caption" color="text.disabled">No image</Typography>
              </Box>
            )}
          </Paper>

          {/* Status badges */}
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
            <Chip
              label={product.isActive ? "Active" : "Inactive"}
              color={product.isActive ? "success" : "default"}
              size="small"
            />
            <Chip label={product.visibility || "PRIVATE"} size="small" variant="outlined" />
            {product.availableForLending && (
              <Chip label="Available for Lending" color="info" size="small" />
            )}
            {isLowStock && (
              <Chip label="Low Stock" color="warning" size="small" icon={<WarningAmberIcon />} />
            )}
          </Stack>

          {/* Extra gallery images */}
          {images.length > 1 && (
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 1 }}>
                GALLERY
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {images.map((url, idx) => (
                  <Box
                    key={`${url}-${idx}`}
                    component="img"
                    src={url}
                    alt={`${product.name} ${idx + 1}`}
                    sx={{ width: 64, height: 64, borderRadius: 1.5, objectFit: "cover", border: "2px solid", borderColor: "divider" }}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Grid>

        {/* Right column — details */}
        <Grid item xs={12} md={8}>
          <Stack spacing={3}>
            {/* Price stat cards */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <StatCard
                icon={<AttachMoneyIcon fontSize="small" />}
                label="Cost Price"
                value={product.costPrice != null ? `${product.costPrice}` : "—"}
                color="primary.main"
                bg="rgba(99,102,241,0.08)"
              />
              <StatCard
                icon={<ShoppingCartIcon fontSize="small" />}
                label="Sale Price"
                value={product.salePrice != null ? `${product.salePrice}` : "—"}
                color="success.main"
                bg="rgba(34,197,94,0.08)"
              />
              <StatCard
                icon={<InventoryIcon fontSize="small" />}
                label="In Stock"
                value={availableQty}
                color={isLowStock ? "warning.main" : "primary.main"}
                bg={isLowStock ? "rgba(245,158,11,0.08)" : "rgba(99,102,241,0.08)"}
              />
              {margin !== null && (
                <StatCard
                  icon={<AttachMoneyIcon fontSize="small" />}
                  label="Margin"
                  value={`${margin}%`}
                  color="secondary.main"
                  bg="rgba(168,85,247,0.08)"
                />
              )}
            </Stack>

            {/* Product info */}
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 4px 24px rgba(15,23,42,0.07)" }}>
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 2, textTransform: "uppercase", letterSpacing: 1 }}>
                Product Details
              </Typography>
              <Grid container spacing={2}>
                {[
                  { icon: <QrCodeIcon fontSize="small" />, label: "SKU", value: product.sku || "—" },
                  { icon: <QrCodeIcon fontSize="small" />, label: "Barcode", value: product.barcode || "—" },
                  { icon: <CategoryIcon fontSize="small" />, label: "Category", value: product.category || "—" },
                  { icon: <ScaleIcon fontSize="small" />, label: "Unit", value: product.unit || "—" },
                  { icon: <WarningAmberIcon fontSize="small" />, label: "Reorder Level", value: product.reorderLevel ?? "—" },
                ].map(({ icon, label, value }) => (
                  <Grid item xs={12} sm={6} key={label}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ color: "text.disabled" }}>{icon}</Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                        <Typography variant="body2" fontWeight={600}>{value}</Typography>
                      </Box>
                    </Stack>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {/* Description */}
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 4px 24px rgba(15,23,42,0.07)" }}>
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1.5, textTransform: "uppercase", letterSpacing: 1 }}>
                Description
              </Typography>
              <Typography variant="body2" color={product.description ? "text.primary" : "text.secondary"} lineHeight={1.8}>
                {product.description || "No description added."}
              </Typography>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
