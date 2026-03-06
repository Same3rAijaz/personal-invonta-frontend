import { Box, Button, Paper, Typography, Grid, TextField, Divider, FormControlLabel, Checkbox, MenuItem, Stack, Avatar } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useCreateProduct } from "../../hooks/useProducts";
import { useToast } from "../../hooks/useToast";
import { useNavigate } from "react-router-dom";
import { uploadImage } from "../../utils/upload";
import { useCategories } from "../../hooks/useCategories";

export default function ProductCreate() {
  const createProduct = useCreateProduct();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<any>({ defaultValues: { isActive: true } });
  const { data: categories = [] } = useCategories({ activeOnly: true });
  const [selectedPathIds, setSelectedPathIds] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

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
    const categoryId = selectedPathIds.length > 0 ? selectedPathIds[selectedPathIds.length - 1] : "";
    setValue("categoryId", categoryId);
  }, [selectedPathIds, setValue]);

  const onSubmit = async (values: any) => {
    try {
      const uploadBase = values.sku ? `products/${values.sku}` : `products/${Date.now()}`;
      const uploadedUrls = files.length
        ? await Promise.all(files.map((file) => uploadImage(file, uploadBase)))
        : [];
      const thumbnailUrl = selectedIndex !== null && uploadedUrls[selectedIndex] ? uploadedUrls[selectedIndex] : uploadedUrls[0];
      await createProduct.mutateAsync({
        ...values,
        categoryId: values.categoryId || undefined,
        subcategory: undefined,
        description: values.description || undefined,
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
            <TextField 
              fullWidth 
              label="SKU *" 
              {...register("sku", { required: "SKU is required" })}
              error={!!errors.sku}
              helperText={errors.sku?.message as string}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth label="Barcode" {...register("barcode")} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField 
              fullWidth 
              label="Name *" 
              {...register("name", { required: "Name is required" })}
              error={!!errors.name}
              helperText={errors.name?.message as string} 
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth multiline rows={3} label="Description" {...register("description")} />
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
              placeholder="Choose category and sub category"
            />
          </Grid>

          {levelOptions.map((options, level) => (
            <Grid item xs={12} md={3} key={`category-level-${level}`}>
              <TextField
                select
                fullWidth
                label={level === 0 ? "Category" : `Sub Category ${level}`}
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
            <TextField 
              fullWidth 
              label="Cost Price *" 
              type="number" 
              {...register("costPrice", { required: "Cost Price is required" })}
              error={!!errors.costPrice}
              helperText={errors.costPrice?.message as string} 
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField 
              fullWidth 
              label="Sale Price *" 
              type="number" 
              {...register("salePrice", { required: "Sale Price is required" })}
              error={!!errors.salePrice}
              helperText={errors.salePrice?.message as string} 
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth label="Reorder Level" type="number" {...register("reorderLevel")} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField select fullWidth label="Visibility" {...register("visibility")}>
              <MenuItem value="PRIVATE">Private</MenuItem>
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
                  <Button key={file.name + idx} onClick={() => setSelectedIndex(idx)} variant={selectedIndex === idx ? "contained" : "outlined"}>
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
