import { Box, Button, Typography, Grid, MenuItem, Divider, IconButton, Stack } from "@mui/material";
import TextField from "../../components/CustomTextField";
import SidebarLayout from "../../components/SidebarLayout";
import React, { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useUpdatePurchaseOrder, usePurchaseOrders } from "../../hooks/usePurchasing";
import { useToast } from "../../hooks/useToast";
import { useNavigate, useParams } from "react-router-dom";
import { useVendors } from "../../hooks/useVendors";
import { useProducts } from "../../hooks/useProducts";
import AddCircleOutline from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutline from "@mui/icons-material/RemoveCircleOutline";
import RelatedEntityDrawer from "../../components/RelatedEntityDrawer";

export default function PurchaseOrderEdit({ explicitId, onSuccess, onCancel }: { explicitId?: string, onSuccess?: () => void, onCancel?: () => void } = {}) {
  const params = useParams();
  const id = explicitId || params.id;
  const { data } = usePurchaseOrders({ page: 1, limit: 1000 });
  const { data: vendors } = useVendors({ page: 1, limit: 1000 });
  const { data: products } = useProducts({ page: 1, limit: 1000 });
  const updatePO = useUpdatePurchaseOrder();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit, control, watch, reset, setValue, formState: { errors } } = useForm<any>({
    defaultValues: { vendorId: "", items: [{ productId: "", qty: 1, unitCost: 0 }] }
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const productMap = React.useMemo(
    () => new Map((products?.items || []).map((item: any) => [String(item._id), item])),
    [products?.items]
  );

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
      if (onSuccess) onSuccess(); else navigate("/purchasing");
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
    <SidebarLayout title="Edit PurchaseOrder" onCancel={onCancel} isSubmitting={updatePO.isPending} submitLabel="Update PurchaseOrder">
        <Grid container spacing={2} component="form" id="sidebar-form" onSubmit={handleSubmit(onSubmit)}>
          <Grid item xs={12} md={6}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "flex-start" }}>
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
                        setValue(`items.${index}.unitCost`, Number(selectedProduct.costPrice || 0), { shouldDirty: true });
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
          
        </Grid>
      <RelatedEntityDrawer
        open={drawerOpen}
        type="vendor"
        onClose={() => setDrawerOpen(false)}
        onCreated={(entity) => {
          setValue("vendorId", String(entity?._id || ""), { shouldDirty: true, shouldValidate: true });
        }}
      />
    </SidebarLayout>
  );
}
