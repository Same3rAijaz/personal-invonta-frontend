import { Box, Button, Paper, Typography, Grid, MenuItem, Divider, TextField } from "@mui/material";
import { useForm } from "react-hook-form";
import { api } from "../../api/client";
import { useToast } from "../../hooks/useToast";
import { useNavigate } from "react-router-dom";
import { useProducts } from "../../hooks/useProducts";
import { useWarehouses } from "../../hooks/useWarehouses";

export default function InventoryCreate() {
  const { notify } = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<any>({
    defaultValues: { action: "receive" }
  });
  const action = watch("action");
  const { data: products } = useProducts({ page: 1, limit: 1000 });
  const { data: warehouses } = useWarehouses({ page: 1, limit: 1000 });

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
            unitCost: Number(values.unitCost),
            refType: values.refType || undefined,
            refId: values.refId || undefined
          }],
          toWarehouseId: values.toWarehouseId
        });
      } else {
        await api.post(`/inventory/${action}`, {
          items: [{
            productId: values.productId,
            warehouseId: values.warehouseId,
            qty: Number(values.qty),
            unitCost: Number(values.unitCost),
            refType: values.refType || undefined,
            refId: values.refId || undefined
          }]
        });
      }
      notify("Inventory updated", "success");
      navigate("/inventory");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Create Inventory</Typography>
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
        <Grid container spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
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
          <Grid item xs={12} md={3}>
            <TextField fullWidth label="Ref Type" {...register("refType")} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Ref ID"
              {...register("refId")}
            />
          </Grid>
          {action === "transfer" ? (
            <>
              <Grid item xs={12} md={12}>
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
              </Grid>
            </>
          ) : null}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" fullWidth sx={{ py: 1.4, fontWeight: 700 }}>
              Create Inventory
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
