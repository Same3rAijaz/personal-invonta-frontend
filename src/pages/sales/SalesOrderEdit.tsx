import { Box, Button, Typography, Grid, MenuItem, Divider, IconButton, Stack } from "@mui/material";
import TextField from "../../components/CustomTextField";
import SidebarLayout from "../../components/SidebarLayout";
import React, { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useUpdateSalesOrder, useSalesOrders } from "../../hooks/useSales";
import { useToast } from "../../hooks/useToast";
import { useNavigate, useParams } from "react-router-dom";
import { useCustomers } from "../../hooks/useCustomers";
import { useProducts } from "../../hooks/useProducts";
import AddCircleOutline from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutline from "@mui/icons-material/RemoveCircleOutline";
import RelatedEntityDrawer from "../../components/RelatedEntityDrawer";

export default function SalesOrderEdit({ explicitId, onSuccess, onCancel }: { explicitId?: string, onSuccess?: () => void, onCancel?: () => void } = {}) {
  const params = useParams();
  const id = explicitId || params.id;
  const { data } = useSalesOrders({ page: 1, limit: 1000 });
  const { data: customers } = useCustomers({ page: 1, limit: 1000 });
  const { data: products } = useProducts({ page: 1, limit: 1000 });
  const updateSO = useUpdateSalesOrder();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit, control, watch, reset, setValue, formState: { errors } } = useForm<any>({
    defaultValues: { customerId: "", items: [{ productId: "", qty: 1, unitPrice: 0 }] }
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const productMap = React.useMemo(
    () => new Map((products?.items || []).map((item: any) => [String(item._id), item])),
    [products?.items]
  );

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
      if (onSuccess) onSuccess(); else navigate("/sales");
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
    <SidebarLayout title="Edit Sales Order" onCancel={onCancel} isSubmitting={updateSO.isPending} submitLabel="Update Sales Order">
      <Grid container spacing={2} component="form" id="sidebar-form" onSubmit={handleSubmit(onSubmit)}>
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
            <TextField fullWidth label="Status" value={order.status} disabled />
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
                      const selectedProduct = productMap.get(String(event.target.value || "")) as any;
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
        </Grid>
      <RelatedEntityDrawer
        open={drawerOpen}
        type="customer"
        onClose={() => setDrawerOpen(false)}
        onCreated={(entity) => {
          setValue("customerId", String(entity?._id || ""), { shouldDirty: true, shouldValidate: true });
        }}
      />
    </SidebarLayout>
  );
}
