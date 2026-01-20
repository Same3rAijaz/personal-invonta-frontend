import { Box, Button, Paper, Typography, Grid, InputAdornment, MenuItem, Divider, TextField } from "@mui/material";
import { useForm } from "react-hook-form";
import { api } from "../../api/client";
import { useToast } from "../../hooks/useToast";
import { useNavigate } from "react-router-dom";
import Inventory2Outlined from "@mui/icons-material/Inventory2Outlined";
import WarehouseOutlined from "@mui/icons-material/WarehouseOutlined";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import NumbersOutlined from "@mui/icons-material/NumbersOutlined";
import PaidOutlined from "@mui/icons-material/PaidOutlined";
import LocalOfferOutlined from "@mui/icons-material/LocalOfferOutlined";

export default function InventoryCreate() {
  const { notify } = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit, watch } = useForm({
    defaultValues: { action: "receive" }
  });
  const action = watch("action");

  const onSubmit = async (values: any) => {
    try {
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
          items: [{
            productId: values.productId,
            warehouseId: values.warehouseId,
            locationId: values.locationId || undefined,
            qty: Number(values.qty),
            unitCost: Number(values.unitCost),
            refType: values.refType || undefined,
            refId: values.refId || undefined
          }],
          toWarehouseId: values.toWarehouseId,
          toLocationId: values.toLocationId || undefined
        });
      } else {
        await api.post(`/inventory/${action}`, {
          items: [{
            productId: values.productId,
            warehouseId: values.warehouseId,
            locationId: values.locationId || undefined,
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
      <Typography variant="h5" gutterBottom>New Inventory Movement</Typography>
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
        <Grid container spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Action"
              {...register("action")}
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
              fullWidth
              label="Product ID"
              {...register("productId")}
              InputProps={{ startAdornment: (<InputAdornment position="start"><Inventory2Outlined /></InputAdornment>) }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Warehouse ID"
              {...register("warehouseId")}
              InputProps={{ startAdornment: (<InputAdornment position="start"><WarehouseOutlined /></InputAdornment>) }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Location ID"
              {...register("locationId")}
              InputProps={{ startAdornment: (<InputAdornment position="start"><PlaceOutlined /></InputAdornment>) }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Qty"
              type="number"
              {...register("qty")}
              InputProps={{ startAdornment: (<InputAdornment position="start"><NumbersOutlined /></InputAdornment>) }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Unit Cost"
              type="number"
              {...register("unitCost")}
              InputProps={{ startAdornment: (<InputAdornment position="start"><PaidOutlined /></InputAdornment>) }}
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
              InputProps={{ startAdornment: (<InputAdornment position="start"><LocalOfferOutlined /></InputAdornment>) }}
            />
          </Grid>
          {action === "transfer" ? (
            <>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="To Warehouse" {...register("toWarehouseId")} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="To Location" {...register("toLocationId")} />
              </Grid>
            </>
          ) : null}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" fullWidth sx={{ py: 1.4, fontWeight: 700 }}>
              Submit Movement
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
