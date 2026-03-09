import { Box, Button, Paper, Typography, Grid, TextField, MenuItem, Divider, IconButton } from "@mui/material";
import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useUpdateSalesOrder, useSalesOrders } from "../../hooks/useSales";
import { useToast } from "../../hooks/useToast";
import { useNavigate, useParams } from "react-router-dom";
import { useCustomers } from "../../hooks/useCustomers";
import { useProducts } from "../../hooks/useProducts";
import AddCircleOutline from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutline from "@mui/icons-material/RemoveCircleOutline";

export default function SalesOrderEdit() {
  const { id } = useParams();
  const { data } = useSalesOrders({ page: 1, limit: 1000 });
  const { data: customers } = useCustomers({ page: 1, limit: 1000 });
  const { data: products } = useProducts({ page: 1, limit: 1000 });
  const updateSO = useUpdateSalesOrder();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<any>({
    defaultValues: { customerId: "", items: [{ productId: "", qty: 1, unitPrice: 0 }] }
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const order = (data?.items || []).find((so: any) => so._id === id);

  useEffect(() => {
    if (order) {
      reset({
        customerId: order.customerId || "",
        items: (order.items || []).map((item: any) => ({
          productId: item.productId,
          qty: item.qty,
          unitPrice: item.unitPrice
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
        unitPrice: Number(item.unitPrice)
      }));
      await updateSO.mutateAsync({ id, payload: { customerId: values.customerId, items } });
      notify("SO updated", "success");
      navigate("/sales");
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
        <Typography variant="h6">This sales order can only be edited while in DRAFT.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Edit Sales Order</Typography>
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
        <Grid container spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid item xs={12} md={6}>
            <TextField 
              select 
              fullWidth 
              label="Customer *" 
              {...register("customerId", { required: "Customer is required" })}
              value={watch("customerId") || ""}
              error={!!errors.customerId}
              helperText={errors.customerId?.message as string}
            >
              {(customers?.items || []).map((c: any) => (
                <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
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
                  label="Unit Price *" 
                  type="number" 
                  {...register(`items.${index}.unitPrice` as const, { required: "Required", min: { value: 0, message: ">= 0" } })}
                  error={!!(errors.items as any)?.[index]?.unitPrice}
                  helperText={(errors.items as any)?.[index]?.unitPrice?.message as string}
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
            <Button startIcon={<AddCircleOutline />} onClick={() => append({ productId: "", qty: 1, unitPrice: 0 })}>
              Add Item
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" fullWidth sx={{ py: 1.4, fontWeight: 700 }}>
              Update Sales Order
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
