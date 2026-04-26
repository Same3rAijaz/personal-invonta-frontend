import { Box, Grid, FormControlLabel, Checkbox, MenuItem } from "@mui/material";
import TextField from "../../components/CustomTextField";
import SidebarLayout from "../../components/SidebarLayout";
import { useForm, Controller } from "react-hook-form";
import { useUpdateLocation, useLocations, useParentLocationOptions } from "../../hooks/useLocations";
import { useWarehouses } from "../../hooks/useWarehouses";
import { useToast } from "../../hooks/useToast";
import { useNavigate, useParams } from "react-router-dom";
import React from "react";

export default function LocationEdit({ explicitId, onSuccess, onCancel }: { explicitId?: string, onSuccess?: () => void, onCancel?: () => void } = {}) {
  const { id: paramId } = useParams<{ id: string }>();
  const id = explicitId || paramId;
  const updateLocation = useUpdateLocation();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { data: warehouses } = useWarehouses({ page: 1, limit: 100 });
  const { data: locationData } = useLocations({ page: 1, limit: 1 });
  const [location, setLocation] = React.useState<any>(null);

  const { register, handleSubmit, watch, setValue, control, reset, formState: { errors } } = useForm<any>({
    defaultValues: { isActive: true, parentId: null }
  });

  React.useEffect(() => {
    if (locationData?.items) {
      const found = locationData.items.find((l: any) => l._id === id);
      if (found) {
        setLocation(found);
        reset({
          name: found.name,
          code: found.code || "",
          description: found.description || "",
          warehouseId: found.warehouseId,
          parentId: found.parentId || null,
          isActive: found.isActive
        });
      }
    }
  }, [locationData, id, reset]);

  const selectedWarehouseId = watch("warehouseId");
  const currentParentId = location?.parentId;
  const { data: parentOptions } = useParentLocationOptions(selectedWarehouseId, id);

  const onSubmit = async (values: any) => {
    if (!id) return;
    try {
      const payload = {
        ...values,
        parentId: values.parentId === "null" || values.parentId === "" ? null : values.parentId
      };
      await updateLocation.mutateAsync({ id, payload });
      notify("Location updated", "success");
      if (onSuccess) onSuccess(); else navigate("/locations");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  if (!location) {
    return (
      <SidebarLayout title="Edit Location" onCancel={onCancel}>
        <Box sx={{ p: 3 }}>Loading...</Box>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title="Edit Location" onCancel={onCancel} isSubmitting={updateLocation.isPending} submitLabel="Update Location">
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
          <FormControlLabel control={<Checkbox {...register("isActive")} />} label="Active" />
        </Grid>
      </Grid>
    </SidebarLayout>
  );
}
