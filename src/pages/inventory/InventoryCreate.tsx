import { Box, Button, Typography, Grid, MenuItem, Divider, Stack } from "@mui/material";
import AddCircleOutline from "@mui/icons-material/AddCircleOutline";
import SidebarLayout from "../../components/SidebarLayout";
import TextField from "../../components/CustomTextField";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { api } from "../../api/client";
import { useToast } from "../../hooks/useToast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useProducts } from "../../hooks/useProducts";
import { useWarehouses } from "../../hooks/useWarehouses";
import { useLocationsByWarehouse } from "../../hooks/useLocations";
import { useQueryClient } from "@tanstack/react-query";
import RelatedEntityDrawer from "../../components/RelatedEntityDrawer";

export default function InventoryCreate({ onSuccess, onCancel }: { onSuccess?: () => void, onCancel?: () => void } = {}) {
  const { notify } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const client = useQueryClient();
  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<any>({
    defaultValues: {
      action: searchParams.get("action") || "receive",
      productId: searchParams.get("productId") || "",
      warehouseId: searchParams.get("warehouseId") || "",
      locationId: "",
      toWarehouseId: "",
      toLocationId: ""
    }
  });
  const action = watch("action");
  const { data: products } = useProducts({ page: 1, limit: 1000 });
  const { data: warehouses } = useWarehouses({ page: 1, limit: 1000 });
  
  const selectedWarehouseId = watch("warehouseId");
  const selectedToWarehouseId = watch("toWarehouseId");
  
  const { data: fromLocations } = useLocationsByWarehouse(selectedWarehouseId);
  const { data: toLocations } = useLocationsByWarehouse(selectedToWarehouseId);
  
  const [warehouseDrawerOpen, setWarehouseDrawerOpen] = React.useState(false);
  const [locationDrawerOpen, setLocationDrawerOpen] = React.useState(false);
  const [toLocationDrawerOpen, setToLocationDrawerOpen] = React.useState(false);
  const [creatingForWarehouse, setCreatingForWarehouse] = React.useState<string | undefined>();

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
      const baseItem = {
        productId: values.productId,
        warehouseId: values.warehouseId,
        locationId: values.locationId || undefined,
        qty: Number(values.qty),
        unitCost: Number(values.unitCost)
      };

      if (action === "stocktake") {
        await api.post("/inventory/stocktake", {
          items: [{
            productId: values.productId,
            warehouseId: values.warehouseId,
            locationId: values.locationId || undefined,
            countedQty: Number(values.qty)
          }]
        });
      } else if (action === "transfer") {
        await api.post("/inventory/transfer", {
          items: [baseItem],
          toWarehouseId: values.toWarehouseId,
          toLocationId: values.toLocationId || undefined
        });
      } else {
        await api.post(`/inventory/${action}`, {
          items: [baseItem]
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
            <Controller
              name="warehouseId"
              control={control}
              rules={{ required: "Warehouse is required" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label="Warehouse *"
                  error={!!errors.warehouseId}
                  helperText={errors.warehouseId?.message as string}
                  onChange={(e: any) => {
                    field.onChange(e);
                    setValue("locationId", "");
                  }}
                >
                  <MenuItem
                    value="CREATE_NEW"
                    onClick={(e) => {
                      e.stopPropagation();
                      setWarehouseDrawerOpen(true);
                    }}
                    sx={{
                      fontWeight: 700,
                      color: "primary.main",
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      py: 1.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 1
                    }}
                  >
                    <AddCircleOutline fontSize="small" />
                    Create New Warehouse
                  </MenuItem>
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
              name="locationId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label="Location (Optional)"
                  disabled={!selectedWarehouseId}
                  value={field.value || ""}
                >
                  <MenuItem value="">
                    <em>Select a location</em>
                  </MenuItem>
                  <MenuItem
                    value="CREATE_NEW"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCreatingForWarehouse(selectedWarehouseId);
                      setLocationDrawerOpen(true);
                    }}
                    sx={{
                      fontWeight: 700,
                      color: "primary.main",
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      py: 1.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 1
                    }}
                  >
                    <AddCircleOutline fontSize="small" />
                    Create New Location
                  </MenuItem>
                  {(fromLocations?.items || []).map((item: any) => (
                    <MenuItem key={item._id} value={item._id}>
                      {item.name} {item.code ? `(${item.code})` : ""}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
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
              <Grid item xs={12} md={6}>
                <Controller
                  name="toWarehouseId"
                  control={control}
                  rules={{ required: action === "transfer" ? "Destination warehouse is required" : false }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="To Warehouse *"
                      error={action === "transfer" && !!errors.toWarehouseId}
                      helperText={action === "transfer" ? errors.toWarehouseId?.message as string : undefined}
                      onChange={(e: any) => {
                        field.onChange(e);
                        setValue("toLocationId", "");
                      }}
                    >
                      <MenuItem
                        value="CREATE_NEW"
                        onClick={(e) => {
                          e.stopPropagation();
                          setWarehouseDrawerOpen(true);
                        }}
                        sx={{
                          fontWeight: 700,
                          color: "primary.main",
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          py: 1.5,
                          display: "flex",
                          alignItems: "center",
                          gap: 1
                        }}
                      >
                        <AddCircleOutline fontSize="small" />
                        Create New Warehouse
                      </MenuItem>
                      {(warehouses?.items || []).map((item: any) => (
                        <MenuItem key={item._id} value={item._id}>
                          {item.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="toLocationId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="To Location (Optional)"
                      disabled={!selectedToWarehouseId}
                      value={field.value || ""}
                    >
                      <MenuItem value="">
                        <em>Select a location</em>
                      </MenuItem>
                      <MenuItem
                        value="CREATE_NEW"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCreatingForWarehouse(selectedToWarehouseId);
                          setToLocationDrawerOpen(true);
                        }}
                        sx={{
                          fontWeight: 700,
                          color: "primary.main",
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          py: 1.5,
                          display: "flex",
                          alignItems: "center",
                          gap: 1
                        }}
                      >
                        <AddCircleOutline fontSize="small" />
                        Create New Location
                      </MenuItem>
                      {(toLocations?.items || []).map((item: any) => (
                        <MenuItem key={item._id} value={item._id}>
                          {item.name} {item.code ? `(${item.code})` : ""}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
            </>
          ) : null}
        </Grid>
      <RelatedEntityDrawer
        open={warehouseDrawerOpen}
        type="warehouse"
        onClose={() => {
          setWarehouseDrawerOpen(false);
          if (watch("warehouseId") === "CREATE_NEW") setValue("warehouseId", "", { shouldValidate: true });
          if (watch("toWarehouseId") === "CREATE_NEW") setValue("toWarehouseId", "", { shouldValidate: true });
        }}
        onCreated={(entity) => {
          const nextId = String(entity?._id || "");
          setValue("warehouseId", nextId, { shouldDirty: true, shouldValidate: true });
          if (action === "transfer") {
            setValue("toWarehouseId", nextId, { shouldDirty: true, shouldValidate: true });
          }
        }}
      />
      <RelatedEntityDrawer
        open={locationDrawerOpen}
        type="location"
        warehouseId={creatingForWarehouse}
        onClose={() => {
          setLocationDrawerOpen(false);
          setCreatingForWarehouse(undefined);
          if (watch("locationId") === "CREATE_NEW") setValue("locationId", "", { shouldValidate: true });
        }}
        onCreated={(entity) => {
          const nextId = String(entity?._id || "");
          setValue("locationId", nextId, { shouldDirty: true, shouldValidate: true });
          setCreatingForWarehouse(undefined);
        }}
      />
      <RelatedEntityDrawer
        open={toLocationDrawerOpen}
        type="location"
        warehouseId={creatingForWarehouse}
        onClose={() => {
          setToLocationDrawerOpen(false);
          setCreatingForWarehouse(undefined);
          if (watch("toLocationId") === "CREATE_NEW") setValue("toLocationId", "", { shouldValidate: true });
        }}
        onCreated={(entity) => {
          const nextId = String(entity?._id || "");
          setValue("toLocationId", nextId, { shouldDirty: true, shouldValidate: true });
          setCreatingForWarehouse(undefined);
        }}
      />
    </SidebarLayout>
  );
}
