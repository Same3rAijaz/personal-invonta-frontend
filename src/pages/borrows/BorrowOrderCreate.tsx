import {
  Box, Button, Divider, Grid, IconButton,
  MenuItem, Paper, TextField, Typography, Alert
} from "@mui/material";
import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import AddCircleOutline from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutline from "@mui/icons-material/RemoveCircleOutline";
import { useCreateBorrowOrder } from "../../hooks/useBorrows";
import { useShopFriends, useFriendProducts } from "../../hooks/useShopFriends";
import { useToast } from "../../hooks/useToast";
import { useWarehouses } from "../../hooks/useWarehouses";

export default function BorrowOrderCreate() {
  const createBO = useCreateBorrowOrder();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { data: warehouses } = useWarehouses({ page: 1, limit: 1000 });
  const { data: friendsData, isLoading: friendsLoading } = useShopFriends();
  const [selectedShopId, setSelectedShopId] = React.useState<string>("");

  const friendList: any[] = friendsData?.items || friendsData || [];
  const selectedFriend = friendList.find((f: any) => {
    const shop = f.business || f;
    return String(shop._id) === selectedShopId;
  });
  const lenderBusinessId = selectedFriend
    ? String((selectedFriend.business || selectedFriend)._id)
    : "";

  const { data: lenderProductsData } = useFriendProducts(lenderBusinessId || null);
  const lenderProducts: any[] = lenderProductsData?.items || lenderProductsData || [];

  const { register, handleSubmit, watch, control, setValue, formState: { errors } } = useForm<any>({
    defaultValues: {
      borrowerWarehouseId: "",
      notes: "",
      items: [{ productId: "", qty: 1, agreedUnitCost: 0 }]
    }
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const onSubmit = async (values: any) => {
    if (!lenderBusinessId) {
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
        lenderBusinessId,
        borrowerWarehouseId: values.borrowerWarehouseId,
        items,
        notes: values.notes || undefined
      });
      notify("Stock loan request sent — waiting for the lender shop to accept", "success");
      navigate("/borrows");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Request Stock Loan</Typography>
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
        <Grid container spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>

          <Grid item xs={12} md={6}>
            {friendsLoading ? (
              <TextField select fullWidth label="Lender Shop *" disabled value="">
                <MenuItem value="">Loading friends…</MenuItem>
              </TextField>
            ) : friendList.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Add shop friends first to borrow stock from them.{" "}
                <Box component="a" href="/shop-friends" sx={{ color: "inherit", fontWeight: 700 }}>
                  Go to Shop Friends →
                </Box>
              </Alert>
            ) : (
              <TextField
                select
                fullWidth
                label="Lender Shop *"
                value={selectedShopId}
                onChange={(e) => {
                  setSelectedShopId(e.target.value);
                  setValue("items", [{ productId: "", qty: 1, agreedUnitCost: 0 }]);
                }}
                helperText="Only your shop friends are listed here"
              >
                {friendList.map((f: any) => {
                  const shop = f.business || f;
                  return (
                    <MenuItem key={String(shop._id)} value={String(shop._id)}>
                      {shop.name}{shop.city ? ` — ${shop.city}` : ""}
                    </MenuItem>
                  );
                })}
              </TextField>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Your Receiving Warehouse *"
              {...register("borrowerWarehouseId", { required: "Warehouse is required" })}
              value={watch("borrowerWarehouseId") || ""}
              error={!!errors.borrowerWarehouseId}
              helperText={(errors.borrowerWarehouseId?.message as string) || "Borrowed stock will be placed in this warehouse"}
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
              placeholder="Reason for the loan, special instructions…"
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
              Items to Borrow
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              Only products the lender has marked as <b>Public (available for lending)</b> are shown here.
            </Typography>
            {selectedShopId && lenderProducts.length === 0 && (
              <Alert severity="info" sx={{ borderRadius: 2, mt: 0.5, mb: 0.5 }}>
                This shop has no products available for lending yet. Ask them to mark products as <b>Public</b> in their product settings.
              </Alert>
            )}
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
                  helperText={
                    !selectedShopId
                      ? "Select a lender shop first"
                      : lenderProducts.length === 0
                      ? "No public products from this shop"
                      : ((errors.items as any)?.[index]?.productId?.message as string) || "Only their public products are listed"
                  }
                  disabled={!selectedShopId || lenderProducts.length === 0}
                >
                  {lenderProducts.map((p: any) => (
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
                  helperText="Cost you'll pay per unit sold"
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
              disabled={!selectedShopId}
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
              disabled={createBO.isPending || !lenderBusinessId}
            >
              Send Loan Request
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
