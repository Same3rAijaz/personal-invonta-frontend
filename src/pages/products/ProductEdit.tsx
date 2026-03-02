import { Box, Button, Paper, Typography, Grid, TextField, Divider, FormControlLabel, Checkbox, MenuItem, Stack, Avatar } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useUpdateProduct, useProducts } from "../../hooks/useProducts";
import { useToast } from "../../hooks/useToast";
import { useNavigate, useParams } from "react-router-dom";
import { uploadImage } from "../../utils/upload";
import { useCategories } from "../../hooks/useCategories";

export default function ProductEdit() {
  const { id } = useParams();
  const { data } = useProducts({ page: 1, limit: 1000 });
  const updateProduct = useUpdateProduct();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit, reset, watch, setValue, control } = useForm({ defaultValues: { isActive: true, visibility: "PRIVATE" } });
  const { data: categories = [] } = useCategories({ activeOnly: true });
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedPathIds, setSelectedPathIds] = useState<string[]>([]);

  const product = (data?.items || []).find((p: any) => p._id === id);
  const categoriesById = useMemo(() => {
    const map = new Map<string, any>();
    (categories || []).forEach((item: any) => map.set(String(item._id), item));
    return map;
  }, [categories]);
  const childrenByParent = useMemo(() => {
    const map = new Map<string, any[]>();
    (categories || []).forEach((item: any) => {
      const key = item.parentId ? String(item.parentId) : "root";
      const list = map.get(key) || [];
      list.push(item);
      map.set(key, list);
    });
    map.forEach((list, key) => map.set(key, [...list].sort((a, b) => String(a.name).localeCompare(String(b.name)))));
    return map;
  }, [categories]);
  const levelOptions = useMemo(() => {
    const levels: any[][] = [];
    let parentKey = "root";
    for (let level = 0; level < 10; level += 1) {
      const options = childrenByParent.get(parentKey) || [];
      if (options.length === 0) break;
      levels.push(options);
      const selectedId = selectedPathIds[level];
      if (!selectedId) break;
      parentKey = selectedId;
    }
    return levels;
  }, [childrenByParent, selectedPathIds]);

  useEffect(() => {
    if (product) {
      reset({
        sku: product.sku || "",
        barcode: product.barcode || "",
        name: product.name || "",
        categoryId: product.categoryId || "",
        unit: product.unit || "",
        costPrice: product.costPrice || 0,
        salePrice: product.salePrice || 0,
        reorderLevel: product.reorderLevel || 0,
        visibility: product.visibility === "MARKET" ? "PUBLIC" : (product.visibility || "PRIVATE"),
        isActive: product.isActive ?? true
      });
      setExistingImages(product.images || []);
      setSelectedKey(product.thumbnailUrl ? `existing:${product.thumbnailUrl}` : (product.images?.[0] ? `existing:${product.images[0]}` : null));
    }
  }, [product, reset]);

  useEffect(() => {
    if (!product || !categories.length) return;
    if (product.categoryId) {
      const category = categoriesById.get(String(product.categoryId));
      if (category) {
        setSelectedPathIds([...(category.pathIds || []), String(category._id)]);
        setValue("categoryId", String(category._id), { shouldDirty: false });
      }
      return;
    }
    if (product.category) {
      const matched = categories.find((item: any) => (item.pathNames || []).join(" > ").toLowerCase() === String(product.category).toLowerCase());
      if (matched?._id) {
        setSelectedPathIds([...(matched.pathIds || []), String(matched._id)]);
        setValue("categoryId", String(matched._id), { shouldDirty: false });
      }
    }
  }, [product, categories, categoriesById, setValue]);

  useEffect(() => {
    const categoryId = selectedPathIds.length > 0 ? selectedPathIds[selectedPathIds.length - 1] : "";
    setValue("categoryId", categoryId, { shouldDirty: true });
  }, [selectedPathIds, setValue]);

  const previewItems = useMemo(() => {
    const existing = existingImages.map((url) => ({ key: `existing:${url}`, url }));
    const added = newFiles.map((file, idx) => ({ key: `new:${idx}`, url: URL.createObjectURL(file) }));
    return [...existing, ...added];
  }, [existingImages, newFiles]);

  const onSubmit = async (values: any) => {
    if (!id) return;
    try {
      const uploadBase = values.sku ? `products/${values.sku}` : `products/${Date.now()}`;
      const uploadedUrls = newFiles.length ? await Promise.all(newFiles.map((file) => uploadImage(file, uploadBase))) : [];
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
          categoryId: values.categoryId || undefined,
          subcategory: undefined,
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
            <TextField
              fullWidth
              label="Selected Category"
              value={
                selectedPathIds.length > 0
                  ? ((categoriesById.get(selectedPathIds[selectedPathIds.length - 1])?.pathNames || []).join(" > ") || "")
                  : ""
              }
              InputProps={{ readOnly: true }}
              placeholder="Choose from category levels"
            />
          </Grid>

          {levelOptions.map((options, level) => (
            <Grid item xs={12} md={3} key={`category-level-${level}`}>
              <TextField
                select
                fullWidth
                label={level === 0 ? "Category Level 1" : `Category Level ${level + 1}`}
                value={selectedPathIds[level] || ""}
                onChange={(event) => {
                  const selectedId = String(event.target.value || "");
                  setSelectedPathIds((prev) => {
                    const next = prev.slice(0, level);
                    if (selectedId) next[level] = selectedId;
                    return next;
                  });
                }}
              >
                <MenuItem value="">None</MenuItem>
                {options.map((item: any) => (
                  <MenuItem key={item._id} value={item._id}>
                    {item.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          ))}

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
            <Controller
              name="visibility"
              control={control}
              render={({ field }) => (
                <TextField select fullWidth label="Visibility" value={field.value || "PRIVATE"} onChange={(event) => field.onChange(event.target.value)}>
                  <MenuItem value="PRIVATE">Private</MenuItem>
                  <MenuItem value="PUBLIC">Public</MenuItem>
                </TextField>
              )}
            />
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
                  <Button key={item.key} onClick={() => setSelectedKey(item.key)} variant={selectedKey === item.key ? "contained" : "outlined"}>
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
