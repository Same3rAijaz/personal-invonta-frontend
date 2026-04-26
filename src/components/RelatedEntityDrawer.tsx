import React from "react";
import { Box, Button, Checkbox, Drawer, FormControlLabel, Grid, IconButton, MenuItem, Paper, Typography } from "@mui/material";
import TextField from "./CustomTextField";
import CloseIcon from "@mui/icons-material/Close";
import { useForm, Controller } from "react-hook-form";
import { useToast } from "../hooks/useToast";
import { useCreateCustomer } from "../hooks/useCustomers";
import { useCreateVendor } from "../hooks/useVendors";
import { useCreateWarehouse } from "../hooks/useWarehouses";
import { useCreateLocation, useParentLocationOptions } from "../hooks/useLocations";
import { useWarehouses } from "../hooks/useWarehouses";
import AddCircleIcon from "@mui/icons-material/AddCircle";

type RelatedEntityType = "customer" | "vendor" | "warehouse" | "location";

type RelatedEntityDrawerProps = {
  open: boolean;
  type: RelatedEntityType;
  onClose: () => void;
  onCreated?: (entity: any) => void;
};

function getConfig(type: RelatedEntityType) {
  if (type === "customer") {
    return { title: "Create New Customer", successMessage: "Customer created successfully" };
  }
  if (type === "vendor") {
    return { title: "Create New Vendor", successMessage: "Vendor created successfully" };
  }
  if (type === "location") {
    return { title: "Create New Location", successMessage: "Location created successfully" };
  }
  return { title: "Create New Warehouse", successMessage: "Warehouse created successfully" };
}

export default function RelatedEntityDrawer(props: RelatedEntityDrawerProps & { warehouseId?: string }) {
  const { open, type, onClose, onCreated, warehouseId: propWarehouseId } = props;
  const { title, successMessage } = getConfig(type);
  const createCustomer = useCreateCustomer();
  const createVendor = useCreateVendor();
  const createWarehouse = useCreateWarehouse();
  const createLocation = useCreateLocation();
  const { data: warehouses } = useWarehouses({ page: 1, limit: 100 });
  const { notify } = useToast();
  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm<any>({
    defaultValues: { isActive: true, parentId: null, warehouseId: propWarehouseId || "" }
  });

  const selectedWarehouseId = watch("warehouseId") || propWarehouseId;
  const { data: parentOptions } = useParentLocationOptions(selectedWarehouseId);

  React.useEffect(() => {
    if (open) {
      reset({ isActive: true, parentId: null, warehouseId: propWarehouseId || "" });
    }
  }, [open, reset, type, propWarehouseId]);

  const onSubmit = async (values: any) => {
    try {
      let created;
      if (type === "customer") {
        created = await createCustomer.mutateAsync(values);
      } else if (type === "vendor") {
        created = await createVendor.mutateAsync(values);
      } else if (type === "warehouse") {
        created = await createWarehouse.mutateAsync(values);
      } else if (type === "location") {
        const payload = {
          ...values,
          parentId: values.parentId === "null" || values.parentId === "" ? null : values.parentId
        };
        created = await createLocation.mutateAsync(payload);
      }
      notify(successMessage, "success");
      onCreated?.(created?.data || created);
      onClose();
      reset({ isActive: true, parentId: null, warehouseId: propWarehouseId || "" });
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed to create entity", "error");
    }
  };

  const isPending =
    type === "customer" ? createCustomer.isPending :
    type === "vendor" ? createVendor.isPending :
    type === "warehouse" ? createWarehouse.isPending :
    createLocation.isPending;

  const renderFormFields = () => {
    if (type === "location") {
      return (
        <>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Name *"
              placeholder="Enter location name"
              {...register("name", { required: "Name is required" })}
              error={!!errors.name}
              helperText={errors.name?.message as string}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Code" placeholder="Location code" {...register("code")} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Description" placeholder="Location description" {...register("description")} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="warehouseId"
              control={control}
              rules={{ required: "Warehouse is required" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label="Warehouse *"
                  error={!!errors.warehouseId}
                  helperText={errors.warehouseId?.message as string}
                  onChange={(e: any) => {
                    field.onChange(e);
                    setValue("parentId", null);
                  }}
                  disabled={!!propWarehouseId}
                >
                  {(warehouses?.items || []).map((w: any) => (
                    <MenuItem key={w._id} value={w._id}>{w.name}</MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="parentId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label="Parent Location (Optional)"
                  disabled={!selectedWarehouseId}
                  value={field.value || "null"}
                >
                  <MenuItem value="null">None (Root Location)</MenuItem>
                  {(parentOptions?.items || []).map((p: any) => (
                    <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
        </>
      );
    }

    return (
      <>
        <Grid item xs={12} md={type === "warehouse" ? 12 : 6}>
          <TextField
            fullWidth
            label="Name *"
            placeholder="Enter display name"
            {...register("name", { required: "Name is required" })}
            error={!!errors.name}
            helperText={errors.name?.message as string}
          />
        </Grid>
        {type !== "warehouse" ? (
          <>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email *"
                type="email"
                placeholder="name@example.com"
                {...register("email", {
                  required: "Email is required",
                  pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" }
                })}
                error={!!errors.email}
                helperText={errors.email?.message as string}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Phone" placeholder="+1234567890" {...register("phone")} />
            </Grid>
          </>
        ) : null}
        <Grid item xs={12} md={type === "warehouse" ? 12 : 6}>
          <TextField fullWidth label="Address" placeholder="Street layout" {...register("address")} />
        </Grid>
        {type !== "warehouse" ? (
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Payment Terms" placeholder="e.g. Net 30" {...register("paymentTerms")} />
          </Grid>
        ) : null}
      </>
    );
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ zIndex: 1400 }}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 500 },
          bgcolor: "background.paper",
          backgroundImage: "none",
          backdropFilter: "blur(20px)"
        }
      }}
    >
      <Box sx={{ p: 3, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid", borderColor: "divider" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <AddCircleIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>{title}</Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ bgcolor: "action.hover" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box sx={{ p: 3, height: "100%", overflowY: "auto" }}>
        <Grid container spacing={2.5} component="form" onSubmit={handleSubmit(onSubmit)}>
          {renderFormFields()}
          <Grid item xs={12}>
            <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: "background.default", border: "1px solid", borderColor: "divider" }}>
              <FormControlLabel control={<Checkbox defaultChecked {...register("isActive")} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Active and available for orders</Typography>} />
            </Paper>
          </Grid>
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Button type="submit" variant="contained" fullWidth sx={{ py: 1.5, fontWeight: 800, borderRadius: 2 }} disabled={isPending}>
              {isPending ? "Creating..." : title}
            </Button>
            <Button variant="text" fullWidth onClick={onClose} sx={{ mt: 1, py: 1.2, color: "text.secondary" }}>
              Cancel
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Drawer>
  );
}
