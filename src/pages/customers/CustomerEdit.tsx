import { Box, Button, Paper, Typography, Grid, TextField, Divider, FormControlLabel, Checkbox } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useCustomers, useUpdateCustomer } from "../../hooks/useCustomers";
import { useToast } from "../../hooks/useToast";
import { useNavigate, useParams } from "react-router-dom";

export default function CustomerEdit() {
  const { id } = useParams();
  const { data } = useCustomers({ page: 1, limit: 1000 });
  const updateCustomer = useUpdateCustomer();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit, reset } = useForm({ defaultValues: { isActive: true } });

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
      navigate("/customers");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  if (!customer) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Edit Customer</Typography>
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
        <Grid container spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Name" {...register("name")} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Email" {...register("email")} />
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
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" fullWidth sx={{ py: 1.4, fontWeight: 700 }}>
              Update Customer
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
