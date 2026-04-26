import { Box, Grid, FormControlLabel, Checkbox, MenuItem } from "@mui/material";
import TextField from "../../components/CustomTextField";
import SidebarLayout from "../../components/SidebarLayout";
import { useForm, Controller } from "react-hook-form";
import { useCreateLocation, useParentLocationOptions } from "../../hooks/useLocations";
import { useWarehouses } from "../../hooks/useWarehouses";
import { useToast } from "../../hooks/useToast";
import { useNavigate } from "react-router-dom";
import React from "react";

export default function LocationCreate({ onSuccess, onCancel }: { onSuccess?: () => void, onCancel?: () => void } = {}) {
  const createLocation = useCreateLocation();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { data: warehouses } = useWarehouses({ page: 1, limit: 100 });
  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<any>({
    defaultValues: { isActive: true, parentId: null }
  });

  const selectedWarehouseId = watch("warehouseId");
  const { data: parentOptions } = useParentLocationOptions(selectedWarehouseId);

  const onSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        parentId: values.parentId === "null" || values.parentId === "" ? null : values.parentId
      };
      await createLocation.mutateAsync(payload);
      notify("Location created", "success");
      if (onSuccess) onSuccess(); else navigate("/locations");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <SidebarLayout title="Create Location" onCancel={onCancel} isSubmitting={createLocation.isPending} submitLabel="Save Location">
      <Grid container spacing={2} component="form" id="sidebar-form" onSubmit={handleSubmit(onSubmit)}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Name *"
            {...register("name", { required: "Name is required" })}
            error={!!errors.name}
            helperText={errors.name?.message as string}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Code"
            {...register("code")}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            {...register("description")}
          />
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
        <Grid item xs={12}>
          <FormControlLabel control={<Checkbox defaultChecked {...register("isActive")} />} label="Active" />
        </Grid>
      </Grid>
    </SidebarLayout>
  );
}
