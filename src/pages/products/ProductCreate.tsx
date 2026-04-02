import { Box, Button, Paper, Typography, Grid, TextField, Divider, FormControlLabel, Checkbox, MenuItem, Stack, Avatar, IconButton } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useCreateProduct } from "../../hooks/useProducts";
import { useToast } from "../../hooks/useToast";
import { useNavigate } from "react-router-dom";
import { uploadImage } from "../../utils/upload";
import { useCategories } from "../../hooks/useCategories";
import { useWarehouses } from "../../hooks/useWarehouses";
import { STANDARD_UNITS } from "../../constants/units";

export default function ProductCreate() {
  const createProduct = useCreateProduct();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<any>({
    defaultValues: { isActive: true, visibility: "PRIVATE", unit: "pcs", quantity: 0, warehouseId: "" }
  });
  const { data: categories = [] } = useCategories({ activeOnly: true });
  const { data: warehouses } = useWarehouses({ page: 1, limit: 1000 });
  const [selectedPathIds, setSelectedPathIds] = useState<string[]>([]);
  const [files, setFiles] = useState<Array<{ id: string; file: File; preview: string }>>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const filesRef = useRef<Array<{ id: string; file: File; preview: string }>>([]);

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


  useEffect(() => {
    if (files.length === 0) {
      if (selectedKey !== null) setSelectedKey(null);
      return;
    }
    if (!selectedKey || !files.some((item) => item.id === selectedKey)) {
      setSelectedKey(files[0].id);
    }
  }, [files, selectedKey]);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    return () => {
      filesRef.current.forEach((item) => URL.revokeObjectURL(item.preview));
    };
  }, []);

  const onSubmit = async (values: any) => {
    try {
      const uploadBase = values.sku ? `products/${values.sku}` : `products/${Date.now()}`;
      const uploadedUrls = files.length
        ? await Promise.all(files.map((item) => uploadImage(item.file, uploadBase)))
        : [];
      const selectedIndex = selectedKey ? files.findIndex((item) => item.id === selectedKey) : -1;
      const thumbnailUrl = selectedIndex >= 0 && uploadedUrls[selectedIndex] ? uploadedUrls[selectedIndex] : uploadedUrls[0];
      await createProduct.mutateAsync({
        ...values,
        categoryId: values.categoryId || undefined,
        subcategory: undefined,
        description: values.description || undefined,
        warehouseId: values.warehouseId,
        quantity: Number(values.quantity || 0),
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
              helperText={errors.sku?.message as string || "Enter a unique product code"}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Barcode"
              {...register("barcode")}
              helperText="Optional — scan or type a barcode"
            />
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
          <Grid item xs={12} md={12}>
            <Box
              sx={{
                minHeight: 56,
                px: 2,
                py: 1,
                borderRadius: 1,
                border: "1px solid rgba(148,163,184,0.35)",
                backgroundColor: "rgba(248,250,252,0.9)",
                display: "flex",
                alignItems: "center",
                gap: 1
              }}
            >
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, mr: 0.5, fontSize: "0.85rem" }}>
                Selected Category:
              </Typography>
              <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 600, fontSize: "0.95rem" }}>
                {selectedPathIds.length > 0
                  ? ((categoriesById.get(selectedPathIds[selectedPathIds.length - 1])?.pathNames || []).join(" > ") || "None selected")
                  : "None selected"}
              </Typography>
            </Box>
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
            <TextField
              select
              fullWidth
              label="Unit *"
              {...register("unit", { required: "Unit is required" })}
              value={watch("unit") || "pcs"}
              error={!!errors.unit}
              helperText={(errors.unit?.message as string) || "Use a standard unit to keep stock records consistent."}
            >
              {STANDARD_UNITS.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>
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
            <TextField
              select
              fullWidth
              label="Warehouse *"
              {...register("warehouseId", { required: "Warehouse is required" })}
              value={watch("warehouseId") || ""}
              error={!!errors.warehouseId}
              helperText={(errors.warehouseId?.message as string) || ((warehouses?.items || []).length === 0 ? "Create a warehouse first." : undefined)}
            >
              <MenuItem value="">Select Warehouse</MenuItem>
              {(warehouses?.items || []).map((item: any) => (
                <MenuItem key={item._id} value={item._id}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Initial Quantity *"
              type="number"
              {...register("quantity", {
                required: "Initial quantity is required",
                min: { value: 0, message: "Quantity must be zero or greater" }
              })}
              error={!!errors.quantity}
              helperText={errors.quantity?.message as string}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select fullWidth
              label="Visible to Other Shops"
              {...register("visibility")}
              value={watch("visibility") || "PRIVATE"}
              helperText="Set to Public to allow other shops to borrow this product"
            >
              <MenuItem value="PRIVATE">Private (my shop only)</MenuItem>
              <MenuItem value="PUBLIC">Public (available for lending)</MenuItem>
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
                  if (newFiles.length === 0) return;
                  const next = newFiles.map((file, index) => ({
                    id: `${Date.now()}-${index}-${file.name}`,
                    file,
                    preview: URL.createObjectURL(file)
                  }));
                  setFiles((prev) => [...prev, ...next]);
                  setSelectedKey((current) => current || next[0]?.id || null);
                  e.currentTarget.value = "";
                }}
              />
            </Button>
          </Grid>
          {files.length > 0 ? (
            <Grid item xs={12}>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                {files.map((item) => (
                  <Box key={item.id} sx={{ position: "relative" }}>
                    <Button onClick={() => setSelectedKey(item.id)} variant={selectedKey === item.id ? "contained" : "outlined"} sx={{ p: 0.5, minWidth: "auto" }}>
                      <Avatar src={item.preview} variant="rounded" sx={{ width: 64, height: 64 }} />
                    </Button>
                    <IconButton
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation();
                        setFiles((prev) => {
                          const target = prev.find((entry) => entry.id === item.id);
                          if (target) {
                            URL.revokeObjectURL(target.preview);
                          }
                          return prev.filter((entry) => entry.id !== item.id);
                        });
                        if (selectedKey === item.id) setSelectedKey(null);
                      }}
                      sx={{
                        position: "absolute",
                        top: -8,
                        right: -8,
                        width: 20,
                        height: 20,
                        bgcolor: "error.main",
                        color: "#fff",
                        "&:hover": { bgcolor: "error.dark" }
                      }}
                    >
                      <Box component="span" sx={{ fontSize: 14, lineHeight: 1 }}>&times;</Box>
                    </IconButton>
                  </Box>
                ))}
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Click an image to set the thumbnail. Click the top-right X to remove it.
              </Typography>
            </Grid>
          ) : null}
          <Grid item xs={12}>
            <Stack direction="row" spacing={3} flexWrap="wrap">
              <FormControlLabel
                control={<Checkbox defaultChecked {...register("isActive")} />}
                label="Active"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    {...register("availableForLending")}
                    sx={{ color: "#0ea5e9", "&.Mui-checked": { color: "#0ea5e9" } }}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>Available for Lending / Borrowing</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Other shops can see and request to borrow this product
                    </Typography>
                  </Box>
                }
              />
            </Stack>
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
