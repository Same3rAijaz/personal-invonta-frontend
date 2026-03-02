import { Box, Button, Chip, Grid, Paper, Stack, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import { useProduct } from "../../hooks/useProducts";

export default function ProductView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(id);

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  if (!product) {
    return <Typography>Product not found.</Typography>;
  }

  return (
    <Box>
      <PageHeader title="Product Details" />
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            {product.thumbnailUrl ? (
              <img
                src={product.thumbnailUrl}
                alt={product.name}
                style={{ width: "100%", maxWidth: 280, borderRadius: 10, objectFit: "cover" }}
              />
            ) : (
              <Box sx={{ width: 280, height: 200, borderRadius: 2, background: "rgba(148,163,184,0.18)" }} />
            )}
          </Grid>
          <Grid item xs={12} md={8}>
            <Stack spacing={1.1}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{product.name}</Typography>
              <Typography color="text.secondary">SKU: {product.sku || "-"}</Typography>
              <Typography color="text.secondary">Barcode: {product.barcode || "-"}</Typography>
              <Typography color="text.secondary">Category: {product.category || "-"}</Typography>
              <Typography color="text.secondary">Unit: {product.unit || "-"}</Typography>
              <Typography color="text.secondary">Cost: {product.costPrice ?? "-"}</Typography>
              <Typography color="text.secondary">Sale: {product.salePrice ?? "-"}</Typography>
              <Typography color="text.secondary">Reorder Level: {product.reorderLevel ?? "-"}</Typography>
              <Stack direction="row" spacing={1}>
                <Chip size="small" label={product.visibility || "PRIVATE"} />
                <Chip size="small" color={product.isActive ? "success" : "default"} label={product.isActive ? "Active" : "Inactive"} />
              </Stack>
              <Typography sx={{ mt: 1 }}>{product.description || "No description added."}</Typography>
            </Stack>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Images</Typography>
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              {(product.images || []).length > 0 ? (
                (product.images || []).map((url: string, idx: number) => (
                  <img key={`${url}-${idx}`} src={url} alt={`product-${idx}`} style={{ width: 96, height: 96, borderRadius: 8, objectFit: "cover" }} />
                ))
              ) : (
                <Typography color="text.secondary">No images uploaded.</Typography>
              )}
            </Stack>
          </Grid>
          <Grid item xs={12}>
            <Stack direction="row" spacing={1.2}>
              <Button variant="outlined" onClick={() => navigate("/products")}>Back</Button>
              <Button variant="contained" onClick={() => navigate(`/products/${product._id}/edit`)}>Edit Product</Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
