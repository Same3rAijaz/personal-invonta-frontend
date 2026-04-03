import { Alert, Box, Button, Paper, Typography, Grid, TextField, MenuItem, Divider, IconButton, Stack } from "@mui/material";
import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useCreateSalesOrder } from "../../hooks/useSales";
import { useToast } from "../../hooks/useToast";
import { useNavigate, useLocation } from "react-router-dom";
import { useCustomers } from "../../hooks/useCustomers";
import { useProducts } from "../../hooks/useProducts";
import AddCircleOutline from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutline from "@mui/icons-material/RemoveCircleOutline";
import RelatedEntityDrawer from "../../components/RelatedEntityDrawer";

export default function SalesOrderCreate() {
  const createSO = useCreateSalesOrder();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const borrowState = (location.state as any) || null;
  const { data: customers } = useCustomers({ page: 1, limit: 1000 });
  const { data: products } = useProducts({ page: 1, limit: 1000 });

  const defaultItems = borrowState?.items?.length
    ? borrowState.items.map((i: any) => ({ productId: i.productId, qty: i.qty, unitPrice: i.unitPrice || 0 }))
    : [{ productId: "", qty: 1, unitPrice: 0 }];

  const { register, handleSubmit, watch, control, setValue, formState: { errors } } = useForm<any>({
    defaultValues: { status: "DRAFT", items: defaultItems }
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const productMap = React.useMemo(
    () => new Map((products?.items || []).map((item: any) => [String(item._id), item])),
    [products?.items]
  );

  const onSubmit = async (values: any) => {
    try {
      const items = values.items.map((item: any, idx: number) => {
        const borrowItem = borrowState?.items?.[idx];
        return {
          productId: item.productId,
          qty: Number(item.qty),
          unitPrice: Number(item.unitPrice),
          ...(borrowItem && borrowState?.borrowOrderId ? {
            borrowOrderId: borrowState.borrowOrderId,
            lenderBusinessId: borrowState.lenderBusinessId,
            agreedUnitCost: borrowItem.agreedUnitCost || 0
          } : {})
        };
      });
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
      {borrowState?.borrowOrderId && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Selling borrowed stock from borrow order. When this order is shipped, the borrow order quantities will update automatically.
        </Alert>
      )}
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
        <Grid container spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid item xs={12} md={6}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "flex-start" }}>
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
              <Button variant="outlined" onClick={() => setDrawerOpen(true)} sx={{ minWidth: 110 }}>
                Create
              </Button>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField select fullWidth label="Status" {...register("status")} value={watch("status") || "DRAFT"}>
              <MenuItem value="DRAFT">DRAFT</MenuItem>
              <MenuItem value="CONFIRMED">CONFIRMED</MenuItem>
            </TextField>
          </Grid>

          {fields.map((field, index) => (
            <Grid container spacing={2} item xs={12} key={field.id}>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Product *"
                  {...register(`items.${index}.productId` as const, {
                    required: "Product is required",
                    onChange: (event) => {
                      const selectedProduct = productMap.get(String(event.target.value || ""));
                      if (selectedProduct) {
                        setValue(`items.${index}.unitPrice`, Number(selectedProduct.salePrice || 0), { shouldDirty: true });
                      }
                    }
                  })}
                  value={watch(`items.${index}.productId`) || ""}
                  error={!!(errors.items as any)?.[index]?.productId}
                  helperText={(errors.items as any)?.[index]?.productId?.message as string}
                >
                  {(products?.items || []).map((p: any) => (
                    <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
                  ))}
                  {/* Include borrowed item if not already in product list */}
                  {borrowState?.items?.[index] && !productMap.has(borrowState.items[index].productId) && (
                    <MenuItem key={borrowState.items[index].productId} value={borrowState.items[index].productId}>
                      {borrowState.items[index].productName || `Product ${borrowState.items[index].productId}`} (borrowed)
                    </MenuItem>
                  )}
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
              Save Sales Order
            </Button>
          </Grid>
        </Grid>
      </Paper>
      <RelatedEntityDrawer
        open={drawerOpen}
        type="customer"
        onClose={() => setDrawerOpen(false)}
        onCreated={(entity) => {
          setValue("customerId", String(entity?._id || ""), { shouldDirty: true, shouldValidate: true });
        }}
      />
    </Box>
  );
}
