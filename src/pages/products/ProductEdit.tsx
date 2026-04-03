import { Box, Button, Paper, Typography, Grid, TextField, Divider, FormControlLabel, Checkbox, MenuItem, Stack, Avatar, IconButton } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useUpdateProduct, useProduct } from "../../hooks/useProducts";
import { useToast } from "../../hooks/useToast";
import { useNavigate, useParams } from "react-router-dom";
import { uploadImage } from "../../utils/upload";
import { useCategories } from "../../hooks/useCategories";
import { STANDARD_UNITS } from "../../constants/units";
import { useWarehouses } from "../../hooks/useWarehouses";
import { useInventoryBalances } from "../../hooks/useInventory";

export default function ProductEdit() {
  const { id } = useParams();
  const { data: product, isLoading } = useProduct(id);
  const updateProduct = useUpdateProduct();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm<any>({
    defaultValues: { isActive: true, visibility: "PRIVATE", unit: "pcs", quantity: 0, warehouseId: "" }
  });
  const { data: categories = [] } = useCategories({ activeOnly: true });
  const { data: warehouses } = useWarehouses({ page: 1, limit: 1000 });
  const { data: balanceData } = useInventoryBalances({ page: 1, limit: 1000, productId: id });
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedPathIds, setSelectedPathIds] = useState<string[]>([]);
  const productBalances = balanceData?.items || [];
  const selectedWarehouseId = watch("warehouseId");
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
        description: product.description || "",
        categoryId: product.categoryId || "",
        unit: product.unit || "",
        costPrice: product.costPrice || 0,
        salePrice: product.salePrice || 0,
        reorderLevel: product.reorderLevel || 0,
        warehouseId: "",
        quantity: product.availableQuantity ?? product.quantity ?? 0,
        visibility: product.visibility === "MARKET" ? "PUBLIC" : (product.visibility || "PRIVATE"),
        isActive: product.isActive ?? true,
        availableForLending: product.availableForLending ?? false
      });
      setExistingImages(product.images || []);
      setSelectedKey(product.thumbnailUrl ? `existing:${product.thumbnailUrl}` : (product.images?.[0] ? `existing:${product.images[0]}` : null));
    }
  }, [product, reset]);

  useEffect(() => {
    if (!product) return;
    if (productBalances.length === 0) {
      if (selectedWarehouseId) return;
      setValue("quantity", 0, { shouldDirty: false });
      return;
    }

    const hasSelectedWarehouse = selectedWarehouseId
      ? productBalances.some((item: any) => String(item.warehouseId) === String(selectedWarehouseId))
      : false;

    if (!hasSelectedWarehouse) {
      const initialBalance = productBalances[0];
      setValue("warehouseId", String(initialBalance.warehouseId || ""), { shouldDirty: false });
      setValue("quantity", Number(initialBalance.qty || 0), { shouldDirty: false });
    }
  }, [product, productBalances, selectedWarehouseId, setValue]);

  useEffect(() => {
    if (!selectedWarehouseId) return;
    const selectedBalance = productBalances.find((item: any) => String(item.warehouseId) === String(selectedWarehouseId));
    setValue("quantity", Number(selectedBalance?.qty || 0), { shouldDirty: false });
  }, [productBalances, selectedWarehouseId, setValue]);

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
          description: values.description || undefined,
          warehouseId: values.warehouseId || undefined,
          quantity: Number(values.quantity || 0),
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

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  if (!product) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Edit Product</Typography>
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
            <Controller
              name="unit"
              control={control}
              rules={{ required: "Unit is required" }}
              render={({ field }) => (
                <TextField
                  select
                  fullWidth
                  label="Unit *"
                  value={field.value || "pcs"}
                  onChange={(event) => field.onChange(event.target.value)}
                  error={!!errors.unit}
                  helperText={(errors.unit?.message as string) || "Use a standard unit to keep stock records consistent."}
                >
                  {STANDARD_UNITS.map((item) => (
                    <MenuItem key={item.value} value={item.value}>
                      {item.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField 
              fullWidth 
              label="Cost Price *" 
              type="number" 
              {...register("costPrice", { required: "Cost Price is required", valueAsNumber: true })}
              error={!!errors.costPrice}
              helperText={errors.costPrice?.message as string} 
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField 
              fullWidth 
              label="Sale Price *" 
              type="number" 
              {...register("salePrice", { required: "Sale Price is required", valueAsNumber: true })}
              error={!!errors.salePrice}
              helperText={errors.salePrice?.message as string} 
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth label="Reorder Level" type="number" {...register("reorderLevel", { valueAsNumber: true })} />
          </Grid>
          <Grid item xs={12} md={3}>
            <Controller
              name="warehouseId"
              control={control}
              rules={{ required: "Warehouse is required" }}
              render={({ field }) => (
                <TextField
                  select
                  fullWidth
                  label="Warehouse *"
                  value={field.value || ""}
                  onChange={(event) => field.onChange(event.target.value)}
                  error={!!errors.warehouseId}
                  helperText={(errors.warehouseId?.message as string) || ((warehouses?.items || []).length === 0 ? "Create a warehouse first." : "Quantity is updated for the selected warehouse.")}
                >
                  <MenuItem value="">Select Warehouse</MenuItem>
                  {(warehouses?.items || []).map((item: any) => (
                    <MenuItem key={item._id} value={item._id}>
                      {item.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Controller
              name="quantity"
              control={control}
              rules={{
                required: "Quantity is required",
                min: { value: 0, message: "Quantity must be zero or greater" }
              }}
              render={({ field }) => (
                <TextField
                  fullWidth
                  label="Quantity *"
                  type="number"
                  value={field.value ?? 0}
                  onChange={(event) => field.onChange(event.target.value === "" ? "" : Number(event.target.value))}
                  error={!!errors.quantity}
                  helperText={(errors.quantity?.message as string) || "This sets the current stock for the selected warehouse."}
                  inputProps={{ min: 0 }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Controller
              name="visibility"
              control={control}
              render={({ field }) => (
                <TextField
                  select fullWidth
                  label="Visible to Other Shops"
                  value={field.value || "PRIVATE"}
                  onChange={(event) => field.onChange(event.target.value)}
                  helperText="Set to Public to allow other shops to borrow this product"
                >
                  <MenuItem value="PRIVATE">Private (my shop only)</MenuItem>
                  <MenuItem value="PUBLIC">Public (available for lending)</MenuItem>
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
                  if (files.length === 0) return;
                  setNewFiles((prev) => [...prev, ...files]);
                  if (files.length && selectedKey === null) {
                    setSelectedKey("new:0");
                  }
                  e.currentTarget.value = "";
                }}
              />
            </Button>
          </Grid>
          {previewItems.length > 0 ? (
            <Grid item xs={12}>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                {previewItems.map((item) => {
                  const isExisting = item.key.startsWith("existing:");
                  return (
                    <Box key={item.key} sx={{ position: "relative" }}>
                      <Button onClick={() => setSelectedKey(item.key)} variant={selectedKey === item.key ? "contained" : "outlined"} sx={{ p: 0.5, minWidth: "auto" }}>
                        <Avatar src={item.url} variant="rounded" sx={{ width: 64, height: 64 }} />
                      </Button>
                      <IconButton
                        size="small"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          if (isExisting) {
                            setExistingImages((prev) => prev.filter((img) => `existing:${img}` !== item.key));
                          } else {
                            const idx = Number(item.key.replace("new:", ""));
                            setNewFiles((prev) => prev.filter((_, i) => i !== idx));
                          }
                          if (selectedKey === item.key) setSelectedKey(null);
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
                  );
                })}
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Click an image to set the thumbnail. Click the top-right X to remove it.
              </Typography>
            </Grid>
          ) : null}
          <Grid item xs={12}>
            <Stack direction="row" spacing={3} flexWrap="wrap">
              <FormControlLabel
                control={<Checkbox {...register("isActive")} checked={!!watch("isActive")} />}
                label="Active"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    {...register("availableForLending")}
                    checked={!!watch("availableForLending")}
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
              Update Product
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
