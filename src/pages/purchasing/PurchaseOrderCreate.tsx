import { Box, Button, Typography, Grid, MenuItem, Divider, IconButton, Stack } from "@mui/material";
import TextField from "../../components/CustomTextField";
import SidebarLayout from "../../components/SidebarLayout";
import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useCreatePurchaseOrder } from "../../hooks/usePurchasing";
import { useToast } from "../../hooks/useToast";
import { useNavigate } from "react-router-dom";
import { useVendors } from "../../hooks/useVendors";
import { useProducts } from "../../hooks/useProducts";
import AddCircleOutline from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutline from "@mui/icons-material/RemoveCircleOutline";
import RelatedEntityDrawer from "../../components/RelatedEntityDrawer";

export default function PurchaseOrderCreate({ onSuccess, onCancel }: { onSuccess?: () => void, onCancel?: () => void } = {}) {
  const createPO = useCreatePurchaseOrder();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { data: vendors } = useVendors({ page: 1, limit: 1000 });
  const { data: products } = useProducts({ page: 1, limit: 1000 });
  const { register, handleSubmit, watch, control, setValue, formState: { errors } } = useForm<any>({
    defaultValues: { status: "DRAFT", items: [{ productId: "", qty: 1, unitCost: 0 }] }
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const productMap = React.useMemo(
    () => new Map((products?.items || []).map((item: any) => [String(item._id), item])),
    [products?.items]
  );

  const onSubmit = async (values: any) => {
    try {
      const items = values.items.map((item: any) => ({
        productId: item.productId,
        qty: Number(item.qty),
        unitCost: Number(item.unitCost)
      }));
      await createPO.mutateAsync({ vendorId: values.vendorId, items, status: values.status });
      notify("PO created", "success");
      if (onSuccess) onSuccess(); else navigate("/purchasing");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <SidebarLayout title="Create PurchaseOrder" onCancel={onCancel} isSubmitting={createPO.isPending} submitLabel="Save PurchaseOrder">
        <Grid container spacing={2} component="form" id="sidebar-form" onSubmit={handleSubmit(onSubmit)}>
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
              <MenuItem 
                value="CREATE_NEW" 
                onClick={(e) => {
                  e.stopPropagation();
                  setDrawerOpen(true);
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
                Create New Vendor
              </MenuItem>
              {(vendors?.items || []).map((v: any) => (
                <MenuItem key={v._id} value={v._id}>{v.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField select fullWidth label="Status" {...register("status")} value={watch("status") || "DRAFT"}>
              <MenuItem value="DRAFT">DRAFT</MenuItem>
              <MenuItem value="APPROVED">APPROVED</MenuItem>
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
        onClose={() => {
          setDrawerOpen(false);
          if (watch("vendorId") === "CREATE_NEW") {
            setValue("vendorId", "", { shouldValidate: true });
          }
        }}
        onCreated={(entity) => {
          setValue("vendorId", String(entity?._id || ""), { shouldDirty: true, shouldValidate: true });
        }}
      />
    </SidebarLayout>
  );
}
