import { Box, Button, Typography, Grid, Divider, FormControlLabel, Checkbox } from "@mui/material";
import TextField from "../../components/CustomTextField";;
import SidebarLayout from "../../components/SidebarLayout";
import { useForm } from "react-hook-form";
import { useCreateVendor } from "../../hooks/useVendors";
import { useToast } from "../../hooks/useToast";
import { useNavigate } from "react-router-dom";

export default function VendorCreate({ onSuccess, onCancel }: { onSuccess?: () => void, onCancel?: () => void } = {}) {
  const createVendor = useCreateVendor();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<any>({ defaultValues: { isActive: true } });

  const onSubmit = async (values: any) => {
    try {
      await createVendor.mutateAsync(values);
      notify("Vendor created", "success");
      if (onSuccess) onSuccess(); else navigate("/vendors");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <SidebarLayout title="Create Vendor" onCancel={onCancel} isSubmitting={createVendor.isPending} submitLabel="Save Vendor">

        <Grid container spacing={2} component="form" id="sidebar-form" onSubmit={handleSubmit(onSubmit)}>
          <Grid item xs={12} md={4}>
            <TextField 
              fullWidth 
              label="Name *" 
              {...register("name", { required: "Name is required" })}
              error={!!errors.name}
              helperText={errors.name?.message as string} 
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField 
              fullWidth 
              label="Email *" 
              type="email"
              {...register("email", { required: "Email is required", pattern: { value: /^\S+@\S+$/i, message: "Invalid email schema" } })}
              error={!!errors.email}
              helperText={errors.email?.message as string} 
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Phone" {...register("phone")} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Address" {...register("address")} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Payment Terms" {...register("paymentTerms")} />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel control={<Checkbox defaultChecked {...register("isActive")} />} label="Active" />
          </Grid>
          
        </Grid>
    </SidebarLayout>
  );
}