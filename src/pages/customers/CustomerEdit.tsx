import { Box, Button, Typography, Grid, Divider, FormControlLabel, Checkbox } from "@mui/material";
import TextField from "../../components/CustomTextField";;
import SidebarLayout from "../../components/SidebarLayout";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useCustomers, useUpdateCustomer } from "../../hooks/useCustomers";
import { useToast } from "../../hooks/useToast";
import { useNavigate, useParams } from "react-router-dom";

export default function CustomerEdit({ explicitId, onSuccess, onCancel }: { explicitId?: string, onSuccess?: () => void, onCancel?: () => void } = {}) {
  const params = useParams();
  const id = explicitId || params.id;
  const { data } = useCustomers({ page: 1, limit: 1000 });
  const updateCustomer = useUpdateCustomer();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>({ defaultValues: { isActive: true } });

  const customer = (data?.items || []).find((item: any) => item._id === id);

  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        paymentTerms: customer.paymentTerms || "",
        isActive: customer.isActive ?? true
      });
    }
  }, [customer, reset]);

  const onSubmit = async (values: any) => {
    if (!id) return;
    try {
      await updateCustomer.mutateAsync({ id, payload: values });
      notify("Customer updated", "success");
      if (onSuccess) onSuccess(); else navigate("/customers");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  if (!customer) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <SidebarLayout title="Edit Customer" onCancel={onCancel} isSubmitting={updateCustomer.isPending} submitLabel="Update Customer">
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
