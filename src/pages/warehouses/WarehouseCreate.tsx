import { Box, Button, Typography, Grid, Divider, FormControlLabel, Checkbox } from "@mui/material";
import TextField from "../../components/CustomTextField";;
import SidebarLayout from "../../components/SidebarLayout";
import { useForm } from "react-hook-form";
import { useCreateWarehouse } from "../../hooks/useWarehouses";
import { useToast } from "../../hooks/useToast";
import { useNavigate } from "react-router-dom";

export default function WarehouseCreate({ onSuccess, onCancel }: { onSuccess?: () => void, onCancel?: () => void } = {}) {
  const createWarehouse = useCreateWarehouse();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<any>({ defaultValues: { isActive: true } });

  const onSubmit = async (values: any) => {
    try {
      await createWarehouse.mutateAsync(values);
      notify("Warehouse created", "success");
      if (onSuccess) onSuccess(); else navigate("/warehouses");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <SidebarLayout title="Create Warehouse" onCancel={onCancel} isSubmitting={createWarehouse.isPending} submitLabel="Save Warehouse">

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
            <TextField fullWidth label="Address" {...register("address")} />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel control={<Checkbox defaultChecked {...register("isActive")} />} label="Active" />
          </Grid>
          
        </Grid>
    </SidebarLayout>
  );
}