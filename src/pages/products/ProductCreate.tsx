import { Box, Button, Paper, Typography, Grid, TextField, Divider, FormControlLabel, Checkbox, MenuItem, Stack, Avatar } from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useCreateProduct } from "../../hooks/useProducts";
import { useToast } from "../../hooks/useToast";
import { useNavigate } from "react-router-dom";
import { uploadImage } from "../../utils/upload";

export default function ProductCreate() {
  const createProduct = useCreateProduct();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm({ defaultValues: { isActive: true } });
  const [files, setFiles] = useState<File[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const onSubmit = async (values: any) => {
    try {
      const uploadBase = values.sku ? `products/${values.sku}` : `products/${Date.now()}`;
      const uploadedUrls = files.length
        ? await Promise.all(
            files.map((file) => uploadImage(file, uploadBase))
          )
        : [];
      const thumbnailUrl =
        selectedIndex !== null && uploadedUrls[selectedIndex]
          ? uploadedUrls[selectedIndex]
          : uploadedUrls[0];
      await createProduct.mutateAsync({
        ...values,
        costPrice: Number(values.costPrice),
        salePrice: Number(values.salePrice),
        reorderLevel: Number(values.reorderLevel || 0),
        images: uploadedUrls,
        thumbnailUrl
      });
      notify("Product created", "success");
      navigate("/products");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Create Product</Typography>
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
              Upload Images
              <input
                type="file"
                hidden
                multiple
                accept="image/*"
                onChange={(e) => {
                  const newFiles = Array.from(e.target.files || []);
                  setFiles(newFiles);
                  setSelectedIndex(newFiles.length ? 0 : null);
                }}
              />
            </Button>
          </Grid>
          {files.length > 0 ? (
            <Grid item xs={12}>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                {files.map((file, idx) => (
                  <Button
                    key={file.name + idx}
                    onClick={() => setSelectedIndex(idx)}
                    variant={selectedIndex === idx ? "contained" : "outlined"}
                  >
                    <Avatar src={URL.createObjectURL(file)} variant="rounded" sx={{ width: 64, height: 64 }} />
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
              Save Product
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
