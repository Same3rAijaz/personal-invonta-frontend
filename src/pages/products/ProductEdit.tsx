import { Box, Button, Paper, Typography, Grid, TextField, Divider, FormControlLabel, Checkbox, MenuItem, Stack, Avatar } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useUpdateProduct, useProducts } from "../../hooks/useProducts";
import { useToast } from "../../hooks/useToast";
import { useNavigate, useParams } from "react-router-dom";
import { uploadImage } from "../../utils/upload";

export default function ProductEdit() {
  const { id } = useParams();
  const { data } = useProducts({ page: 1, limit: 1000 });
  const updateProduct = useUpdateProduct();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit, reset } = useForm({ defaultValues: { isActive: true, visibility: "PRIVATE" } });
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const product = (data?.items || []).find((p: any) => p._id === id);

  useEffect(() => {
    if (product) {
      reset({
        sku: product.sku || "",
        barcode: product.barcode || "",
        name: product.name || "",
        category: product.category || "",
        unit: product.unit || "",
        costPrice: product.costPrice || 0,
        salePrice: product.salePrice || 0,
        reorderLevel: product.reorderLevel || 0,
        visibility: product.visibility || "PRIVATE",
        isActive: product.isActive ?? true
      });
      setExistingImages(product.images || []);
      setSelectedKey(product.thumbnailUrl ? `existing:${product.thumbnailUrl}` : (product.images?.[0] ? `existing:${product.images[0]}` : null));
    }
  }, [product, reset]);

  const previewItems = useMemo(() => {
    const existing = existingImages.map((url) => ({ key: `existing:${url}`, url }));
    const added = newFiles.map((file, idx) => ({ key: `new:${idx}`, url: URL.createObjectURL(file) }));
    return [...existing, ...added];
  }, [existingImages, newFiles]);

  const onSubmit = async (values: any) => {
    if (!id) return;
    try {
      const uploadBase = values.sku ? `products/${values.sku}` : `products/${Date.now()}`;
      const uploadedUrls = newFiles.length
        ? await Promise.all(
            newFiles.map((file) => uploadImage(file, uploadBase))
          )
        : [];
      const mergedImages = [...existingImages, ...uploadedUrls];
      let thumbnailUrl = product?.thumbnailUrl;
      if (selectedKey?.startsWith("existing:")) {
        thumbnailUrl = selectedKey.replace("existing:", "");
      } else if (selectedKey?.startsWith("new:")) {
        const idx = Number(selectedKey.replace("new:", ""));
        thumbnailUrl = uploadedUrls[idx];
      }
      if (!thumbnailUrl && mergedImages.length > 0) {
        thumbnailUrl = mergedImages[0];
      }
      await updateProduct.mutateAsync({
        id,
        payload: {
          ...values,
          costPrice: Number(values.costPrice),
          salePrice: Number(values.salePrice),
          reorderLevel: Number(values.reorderLevel || 0),
          images: mergedImages,
          thumbnailUrl
        }
      });
      notify("Product updated", "success");
      navigate("/products");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  if (!product) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Edit Product</Typography>
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
        <Grid container spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid item xs={12} md={3}>
            <TextField fullWidth label="SKU" {...register("sku")} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth label="Barcode" {...register("barcode")} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth label="Name" {...register("name")} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth label="Category" {...register("category")} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth label="Unit" {...register("unit")} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth label="Cost Price" type="number" {...register("costPrice")} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth label="Sale Price" type="number" {...register("salePrice")} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth label="Reorder Level" type="number" {...register("reorderLevel")} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField select fullWidth label="Visibility" {...register("visibility")}>
              <MenuItem value="PRIVATE">Private</MenuItem>
              <MenuItem value="MARKET">Market</MenuItem>
              <MenuItem value="PUBLIC">Public</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Button variant="outlined" component="label">
              Add Images
              <input
                type="file"
                hidden
                multiple
                accept="image/*"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setNewFiles(files);
                  if (files.length && selectedKey === null) {
                    setSelectedKey("new:0");
                  }
                }}
              />
            </Button>
          </Grid>
          {previewItems.length > 0 ? (
            <Grid item xs={12}>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                {previewItems.map((item) => (
                  <Button
                    key={item.key}
                    onClick={() => setSelectedKey(item.key)}
                    variant={selectedKey === item.key ? "contained" : "outlined"}
                  >
                    <Avatar src={item.url} variant="rounded" sx={{ width: 64, height: 64 }} />
                  </Button>
                ))}
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Click an image to set the thumbnail.
              </Typography>
            </Grid>
          ) : null}
          <Grid item xs={12}>
            <FormControlLabel control={<Checkbox defaultChecked {...register("isActive")} />} label="Active" />
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" fullWidth sx={{ py: 1.4, fontWeight: 700 }}>
              Update Product
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
