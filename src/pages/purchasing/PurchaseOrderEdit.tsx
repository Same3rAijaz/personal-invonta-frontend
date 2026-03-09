import { Box, Button, Paper, Typography, Grid, TextField, MenuItem, Divider, IconButton } from "@mui/material";
import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useUpdatePurchaseOrder, usePurchaseOrders } from "../../hooks/usePurchasing";
import { useToast } from "../../hooks/useToast";
import { useNavigate, useParams } from "react-router-dom";
import { useVendors } from "../../hooks/useVendors";
import { useProducts } from "../../hooks/useProducts";
import AddCircleOutline from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutline from "@mui/icons-material/RemoveCircleOutline";

export default function PurchaseOrderEdit() {
  const { id } = useParams();
  const { data } = usePurchaseOrders({ page: 1, limit: 1000 });
  const { data: vendors } = useVendors({ page: 1, limit: 1000 });
  const { data: products } = useProducts({ page: 1, limit: 1000 });
  const updatePO = useUpdatePurchaseOrder();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<any>({
    defaultValues: { vendorId: "", items: [{ productId: "", qty: 1, unitCost: 0 }] }
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const order = (data?.items || []).find((po: any) => po._id === id);

  useEffect(() => {
    if (order) {
      reset({
        vendorId: order.vendorId || "",
        items: (order.items || []).map((item: any) => ({
          productId: item.productId,
          qty: item.qty,
          unitCost: item.unitCost
        }))
      });
    }
  }, [order, reset]);

  const onSubmit = async (values: any) => {
    if (!id) return;
    try {
      const items = values.items.map((item: any) => ({
        productId: item.productId,
        qty: Number(item.qty),
        unitCost: Number(item.unitCost)
      }));
      await updatePO.mutateAsync({ id, payload: { vendorId: values.vendorId, items } });
      notify("PO updated", "success");
      navigate("/purchasing");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  if (!order) {
    return <Typography>Loading...</Typography>;
  }

  if (order.status !== "DRAFT") {
    return (
      <Box>
        <Typography variant="h6">This purchase order can only be edited while in DRAFT.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Edit Purchase Order</Typography>
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
        <Grid container spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid item xs={12} md={6}>
            <TextField 
              select 
              fullWidth 
              label="Vendor *" 
              {...register("vendorId", { required: "Vendor is required" })}
              value={watch("vendorId") || ""}
              error={!!errors.vendorId}
              helperText={errors.vendorId?.message as string}
            >
              {(vendors?.items || []).map((v: any) => (
                <MenuItem key={v._id} value={v._id}>{v.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Status" value={order.status} disabled />
          </Grid>

          {fields.map((field, index) => (
            <Grid container spacing={2} item xs={12} key={field.id}>
              <Grid item xs={12} md={6}>
                <TextField 
                  select 
                  fullWidth 
                  label="Product *" 
                  {...register(`items.${index}.productId` as const, { required: "Product is required" })}
                  value={watch(`items.${index}.productId`) || ""}
                  error={!!(errors.items as any)?.[index]?.productId}
                  helperText={(errors.items as any)?.[index]?.productId?.message as string}
                >
                  {(products?.items || []).map((p: any) => (
                    <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField 
                  fullWidth 
                  label="Qty *" 
                  type="number" 
                  {...register(`items.${index}.qty` as const, { required: "Required", min: { value: 1, message: "> 0" } })} 
                  error={!!(errors.items as any)?.[index]?.qty}
                  helperText={(errors.items as any)?.[index]?.qty?.message as string}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField 
                  fullWidth 
                  label="Unit Cost *" 
                  type="number" 
                  {...register(`items.${index}.unitCost` as const, { required: "Required", min: { value: 0, message: ">= 0" } })} 
                  error={!!(errors.items as any)?.[index]?.unitCost}
                  helperText={(errors.items as any)?.[index]?.unitCost?.message as string}
                />
              </Grid>
              <Grid item xs={12} md={1} sx={{ display: "flex", alignItems: "center" }}>
                <IconButton onClick={() => remove(index)} color="error">
                  <RemoveCircleOutline />
                </IconButton>
              </Grid>
            </Grid>
          ))}

          <Grid item xs={12}>
            <Button startIcon={<AddCircleOutline />} onClick={() => append({ productId: "", qty: 1, unitCost: 0 })}>
              Add Item
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" fullWidth sx={{ py: 1.4, fontWeight: 700 }}>
              Update Purchase Order
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
