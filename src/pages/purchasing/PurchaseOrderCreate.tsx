import { Box, Button, Paper, Typography, Grid, TextField, MenuItem, Divider, IconButton } from "@mui/material";
import { useForm, useFieldArray } from "react-hook-form";
import { useCreatePurchaseOrder } from "../../hooks/usePurchasing";
import { useToast } from "../../hooks/useToast";
import { useNavigate } from "react-router-dom";
import { useVendors } from "../../hooks/useVendors";
import { useProducts } from "../../hooks/useProducts";
import AddCircleOutline from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutline from "@mui/icons-material/RemoveCircleOutline";

export default function PurchaseOrderCreate() {
  const createPO = useCreatePurchaseOrder();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { data: vendors } = useVendors({ page: 1, limit: 1000 });
  const { data: products } = useProducts({ page: 1, limit: 1000 });
  const { register, handleSubmit, control } = useForm({
    defaultValues: { status: "DRAFT", items: [{ productId: "", qty: 1, unitCost: 0 }] }
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const onSubmit = async (values: any) => {
    try {
      const items = values.items.map((item: any) => ({
        productId: item.productId,
        qty: Number(item.qty),
        unitCost: Number(item.unitCost)
      }));
      await createPO.mutateAsync({ vendorId: values.vendorId, items, status: values.status });
      notify("PO created", "success");
      navigate("/purchasing");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Create Purchase Order</Typography>
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
        <Grid container spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid item xs={12} md={6}>
            <TextField select fullWidth label="Vendor" {...register("vendorId")}>
              {(vendors?.items || []).map((v: any) => (
                <MenuItem key={v._id} value={v._id}>{v.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField select fullWidth label="Status" {...register("status")}>
              <MenuItem value="DRAFT">DRAFT</MenuItem>
              <MenuItem value="APPROVED">APPROVED</MenuItem>
              <MenuItem value="RECEIVED">RECEIVED</MenuItem>
              <MenuItem value="CLOSED">CLOSED</MenuItem>
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
                <TextField fullWidth label="Unit Cost" type="number" {...register(`items.${index}.unitCost` as const)} />
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
              Save Purchase Order
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
