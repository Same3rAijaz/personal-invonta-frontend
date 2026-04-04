import { Box, Button, Typography, Grid, Divider, FormControlLabel, Checkbox } from "@mui/material";
import TextField from "../../components/CustomTextField";;
import SidebarLayout from "../../components/SidebarLayout";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useVendors, useUpdateVendor } from "../../hooks/useVendors";
import { useToast } from "../../hooks/useToast";
import { useNavigate, useParams } from "react-router-dom";

export default function VendorEdit({ explicitId, onSuccess, onCancel }: { explicitId?: string, onSuccess?: () => void, onCancel?: () => void } = {}) {
  const params = useParams();
  const id = explicitId || params.id;
  const { data } = useVendors({ page: 1, limit: 1000 });
  const updateVendor = useUpdateVendor();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>({ defaultValues: { isActive: true } });

  const vendor = (data?.items || []).find((item: any) => item._id === id);

  useEffect(() => {
    if (vendor) {
      reset({
        name: vendor.name || "",
        email: vendor.email || "",
        phone: vendor.phone || "",
        address: vendor.address || "",
        paymentTerms: vendor.paymentTerms || "",
        isActive: vendor.isActive ?? true
      });
    }
  }, [vendor, reset]);

  const onSubmit = async (values: any) => {
    if (!id) return;
    try {
      await updateVendor.mutateAsync({ id, payload: values });
      notify("Vendor updated", "success");
      if (onSuccess) onSuccess(); else navigate("/vendors");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  if (!vendor) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <SidebarLayout title="Edit Vendor" onCancel={onCancel} isSubmitting={updateVendor.isPending} submitLabel="Update Vendor">

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
