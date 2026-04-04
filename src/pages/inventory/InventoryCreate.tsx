import { Box, Button, Typography, Grid, MenuItem, Divider, Stack } from "@mui/material";
import SidebarLayout from "../../components/SidebarLayout";
import TextField from "../../components/CustomTextField";
import React from "react";
import { useForm } from "react-hook-form";
import { api } from "../../api/client";
import { useToast } from "../../hooks/useToast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useProducts } from "../../hooks/useProducts";
import { useWarehouses } from "../../hooks/useWarehouses";
import { useQueryClient } from "@tanstack/react-query";
import RelatedEntityDrawer from "../../components/RelatedEntityDrawer";

export default function InventoryCreate({ onSuccess, onCancel }: { onSuccess?: () => void, onCancel?: () => void } = {}) {
  const { notify } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const client = useQueryClient();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<any>({
    defaultValues: {
      action: searchParams.get("action") || "receive",
      productId: searchParams.get("productId") || "",
      warehouseId: searchParams.get("warehouseId") || ""
    }
  });
  const action = watch("action");
  const { data: products } = useProducts({ page: 1, limit: 1000 });
  const { data: warehouses } = useWarehouses({ page: 1, limit: 1000 });
  const [warehouseDrawerOpen, setWarehouseDrawerOpen] = React.useState(false);

  const selectedProductId = watch("productId");

  React.useEffect(() => {
    const actionValue = searchParams.get("action");
    const productIdValue = searchParams.get("productId");
    const warehouseIdValue = searchParams.get("warehouseId");
    if (actionValue) setValue("action", actionValue);
    if (productIdValue) setValue("productId", productIdValue);
    if (warehouseIdValue) setValue("warehouseId", warehouseIdValue);
  }, [searchParams, setValue]);

  React.useEffect(() => {
    const selectedProduct = (products?.items || []).find((item: any) => String(item._id) === String(selectedProductId || ""));
    if (selectedProduct && action !== "stocktake") {
      setValue("unitCost", Number(selectedProduct.costPrice || 0), { shouldDirty: true });
    }
  }, [action, products?.items, selectedProductId, setValue]);

  const onSubmit = async (values: any) => {
    try {
      if (action === "stocktake") {
        await api.post("/inventory/stocktake", {
          items: [{
            productId: values.productId,
            warehouseId: values.warehouseId,
            countedQty: Number(values.qty)
          }]
        });
      } else if (action === "transfer") {
        await api.post("/inventory/transfer", {
          items: [{
            productId: values.productId,
            warehouseId: values.warehouseId,
            qty: Number(values.qty),
            unitCost: Number(values.unitCost)
          }],
          toWarehouseId: values.toWarehouseId
        });
      } else {
        await api.post(`/inventory/${action}`, {
          items: [{
            productId: values.productId,
            warehouseId: values.warehouseId,
            qty: Number(values.qty),
            unitCost: Number(values.unitCost)
          }]
        });
      }
      await Promise.all([
        client.invalidateQueries({ queryKey: ["inventory", "balances"] }),
        client.invalidateQueries({ queryKey: ["products"] })
      ]);
      notify("Inventory updated", "success");
      if (onSuccess) onSuccess(); else navigate("/inventory");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <SidebarLayout title="Create Inventory" onCancel={onCancel} isSubmitting={false} submitLabel="Save Inventory">
        <Grid container spacing={2} component="form" id="sidebar-form" onSubmit={handleSubmit(onSubmit)}>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Action *"
              {...register("action", { required: "Action is required" })}
              value={watch("action") || ""}
              error={!!errors.action}
              helperText={errors.action?.message as string}
            >
              <MenuItem value="receive">Receive</MenuItem>
              <MenuItem value="issue">Issue</MenuItem>
              <MenuItem value="transfer">Transfer</MenuItem>
              <MenuItem value="adjust">Adjust</MenuItem>
              <MenuItem value="stocktake">Stock Take</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Product *"
              {...register("productId", { required: "Product is required" })}
              value={watch("productId") || ""}
              error={!!errors.productId}
              helperText={errors.productId?.message as string}
            >
              {(products?.items || []).map((item: any) => (
                <MenuItem key={item._id} value={item._id}>
                  {item.name} ({item.sku})
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "flex-start" }}>
              <TextField
                select
                fullWidth
                label="Warehouse *"
                {...register("warehouseId", { required: "Warehouse is required" })}
                value={watch("warehouseId") || ""}
                error={!!errors.warehouseId}
                helperText={errors.warehouseId?.message as string}
              >
                {(warehouses?.items || []).map((item: any) => (
                  <MenuItem key={item._id} value={item._id}>
                    {item.name}
                  </MenuItem>
                ))}
              </TextField>
              <Button variant="outlined" onClick={() => setWarehouseDrawerOpen(true)} sx={{ minWidth: 110 }}>
                Create
              </Button>
            </Stack>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Qty *"
              type="number"
              {...register("qty", { required: "Quantity is required", min: { value: 1, message: "Qty must be > 0" } })}
              error={!!errors.qty}
              helperText={errors.qty?.message as string}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Unit Cost"
              type="number"
              {...register("unitCost")}
            />
          </Grid>
          {action === "transfer" ? (
            <>
              <Grid item xs={12} md={12}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "flex-start" }}>
                  <TextField 
                    select
                    fullWidth 
                    label="To Warehouse *" 
                    {...register("toWarehouseId", { required: action === "transfer" ? "Destination warehouse is required" : false })} 
                    value={watch("toWarehouseId") || ""}
                    error={action === "transfer" && !!errors.toWarehouseId}
                    helperText={action === "transfer" ? errors.toWarehouseId?.message as string : undefined}
                  >
                    {(warehouses?.items || []).map((item: any) => (
                      <MenuItem key={item._id} value={item._id}>
                        {item.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Button variant="outlined" onClick={() => setWarehouseDrawerOpen(true)} sx={{ minWidth: 110 }}>
                    Create
                  </Button>
                </Stack>
              </Grid>
            </>
          ) : null}
        </Grid>
      <RelatedEntityDrawer
        open={warehouseDrawerOpen}
        type="warehouse"
        onClose={() => setWarehouseDrawerOpen(false)}
        onCreated={(entity) => {
          const nextId = String(entity?._id || "");
          setValue("warehouseId", nextId, { shouldDirty: true, shouldValidate: true });
          if (action === "transfer" && !watch("toWarehouseId")) {
            setValue("toWarehouseId", nextId, { shouldDirty: true, shouldValidate: true });
          }
        }}
      />
    </SidebarLayout>
  );
}
