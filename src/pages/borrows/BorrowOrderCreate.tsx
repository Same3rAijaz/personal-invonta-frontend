import {
  Autocomplete, Box, Button, Divider, Grid, IconButton,
  MenuItem, Paper, TextField, Typography
} from "@mui/material";
import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import AddCircleOutline from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutline from "@mui/icons-material/RemoveCircleOutline";
import { useCreateBorrowOrder } from "../../hooks/useBorrows";
import { useBusinessDirectory } from "../../hooks/useBusinessDirectory";
import { useToast } from "../../hooks/useToast";
import { useProducts } from "../../hooks/useProducts";
import { useWarehouses } from "../../hooks/useWarehouses";

export default function BorrowOrderCreate() {
  const createBO = useCreateBorrowOrder();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { data: products } = useProducts({ page: 1, limit: 1000 });
  const { data: warehouses } = useWarehouses({ page: 1, limit: 1000 });
  const [shopSearch, setShopSearch] = React.useState("");
  const { data: directory } = useBusinessDirectory(shopSearch || undefined);
  const [selectedShop, setSelectedShop] = React.useState<any>(null);

  const { register, handleSubmit, watch, control, setValue, formState: { errors } } = useForm<any>({
    defaultValues: {
      borrowerWarehouseId: "",
      notes: "",
      items: [{ productId: "", qty: 1, agreedUnitCost: 0 }]
    }
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const onSubmit = async (values: any) => {
    if (!selectedShop) {
      notify("Select a lender shop", "error");
      return;
    }
    try {
      const items = values.items.map((item: any) => ({
        productId: item.productId,
        qty: Number(item.qty),
        agreedUnitCost: Number(item.agreedUnitCost)
      }));
      await createBO.mutateAsync({
        lenderBusinessId: selectedShop._id,
        borrowerWarehouseId: values.borrowerWarehouseId,
        items,
        notes: values.notes || undefined
      });
      notify("Borrow request sent — waiting for the lender shop to accept", "success");
      navigate("/borrows");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Request to Borrow</Typography>
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
        <Grid container spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>

          <Grid item xs={12} md={6}>
            <Autocomplete
              options={directory?.items || []}
              getOptionLabel={(option: any) =>
                `${option.name}${option.city ? ` — ${option.city}` : ""}`
              }
              value={selectedShop}
              onChange={(_, value) => setSelectedShop(value)}
              onInputChange={(_, value) => setShopSearch(value)}
              isOptionEqualToValue={(a: any, b: any) => a._id === b._id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Lender Shop *"
                  helperText="Search and select the shop you want to borrow from"
                />
              )}
              noOptionsText="No shops found"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Your Receiving Warehouse *"
              {...register("borrowerWarehouseId", { required: "Warehouse is required" })}
              value={watch("borrowerWarehouseId") || ""}
              error={!!errors.borrowerWarehouseId}
              helperText={(errors.borrowerWarehouseId?.message as string) || "Stock will land in this warehouse"}
            >
              {(warehouses?.items || []).map((w: any) => (
                <MenuItem key={w._id} value={w._id}>{w.name}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={2}
              {...register("notes")}
              placeholder="Reason for borrowing, any special instructions…"
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
              Items to Borrow
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              The lender shop will assign their warehouse when they accept your request.
            </Typography>
          </Grid>

          {fields.map((field, index) => (
            <Grid container spacing={2} item xs={12} key={field.id}>
              <Grid item xs={12} md={5}>
                <TextField
                  select
                  fullWidth
                  label="Product *"
                  {...register(`items.${index}.productId` as const, { required: "Required" })}
                  value={watch(`items.${index}.productId`) || ""}
                  error={!!(errors.items as any)?.[index]?.productId}
                  helperText={(errors.items as any)?.[index]?.productId?.message as string}
                >
                  {(products?.items || []).map((p: any) => (
                    <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={5} md={3}>
                <TextField
                  fullWidth
                  label="Qty *"
                  type="number"
                  {...register(`items.${index}.qty` as const, { required: "Required", min: { value: 1, message: "> 0" } })}
                  error={!!(errors.items as any)?.[index]?.qty}
                  helperText={(errors.items as any)?.[index]?.qty?.message as string}
                />
              </Grid>
              <Grid item xs={5} md={3}>
                <TextField
                  fullWidth
                  label="Agreed Cost / Unit *"
                  type="number"
                  inputProps={{ step: "0.01" }}
                  {...register(`items.${index}.agreedUnitCost` as const, { required: "Required", min: { value: 0, message: ">= 0" } })}
                  helperText="You'll pay this per unit sold"
                  error={!!(errors.items as any)?.[index]?.agreedUnitCost}
                />
              </Grid>
              <Grid item xs={2} md={1} sx={{ display: "flex", alignItems: "center" }}>
                <IconButton onClick={() => remove(index)} color="error">
                  <RemoveCircleOutline />
                </IconButton>
              </Grid>
            </Grid>
          ))}

          <Grid item xs={12}>
            <Button
              startIcon={<AddCircleOutline />}
              onClick={() => append({ productId: "", qty: 1, agreedUnitCost: 0 })}
            >
              Add Item
            </Button>
          </Grid>

          <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ py: 1.4, fontWeight: 700 }}
              disabled={createBO.isPending}
            >
              Send Borrow Request
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
