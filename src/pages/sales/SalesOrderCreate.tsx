import { Box, Button, Paper, Typography, Grid, TextField, MenuItem, Divider, IconButton } from "@mui/material";
import { useForm, useFieldArray } from "react-hook-form";
import { useCreateSalesOrder } from "../../hooks/useSales";
import { useToast } from "../../hooks/useToast";
import { useNavigate } from "react-router-dom";
import { useCustomers } from "../../hooks/useCustomers";
import { useProducts } from "../../hooks/useProducts";
import AddCircleOutline from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutline from "@mui/icons-material/RemoveCircleOutline";

export default function SalesOrderCreate() {
  const createSO = useCreateSalesOrder();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { data: customers } = useCustomers({ page: 1, limit: 1000 });
  const { data: products } = useProducts({ page: 1, limit: 1000 });
  const { register, handleSubmit, control } = useForm({
    defaultValues: { status: "DRAFT", items: [{ productId: "", qty: 1, unitPrice: 0 }] }
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const onSubmit = async (values: any) => {
    try {
      const items = values.items.map((item: any) => ({
        productId: item.productId,
        qty: Number(item.qty),
        unitPrice: Number(item.unitPrice)
      }));
      await createSO.mutateAsync({ customerId: values.customerId, items, status: values.status });
      notify("SO created", "success");
      navigate("/sales");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Create Sales Order</Typography>
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
        <Grid container spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid item xs={12} md={6}>
            <TextField select fullWidth label="Customer" {...register("customerId")}>
              {(customers?.items || []).map((c: any) => (
                <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField select fullWidth label="Status" {...register("status")}>
              <MenuItem value="DRAFT">DRAFT</MenuItem>
              <MenuItem value="CONFIRMED">CONFIRMED</MenuItem>
              <MenuItem value="SHIPPED">SHIPPED</MenuItem>
              <MenuItem value="INVOICED">INVOICED</MenuItem>
              <MenuItem value="CANCELLED">CANCELLED</MenuItem>
            </TextField>
          </Grid>

          {fields.map((field, index) => (
            <Grid container spacing={2} item xs={12} key={field.id}>
              <Grid item xs={12} md={6}>
                <TextField select fullWidth label="Product" {...register(`items.${index}.productId` as const)}>
                  {(products?.items || []).map((p: any) => (
                    <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField fullWidth label="Qty" type="number" {...register(`items.${index}.qty` as const)} />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField fullWidth label="Unit Price" type="number" {...register(`items.${index}.unitPrice` as const)} />
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
              Save Sales Order
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
