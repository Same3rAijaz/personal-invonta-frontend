import { Box, Button, Paper, Typography, Grid, TextField, Divider, FormControlLabel, Checkbox } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useVendors, useUpdateVendor } from "../../hooks/useVendors";
import { useToast } from "../../hooks/useToast";
import { useNavigate, useParams } from "react-router-dom";

export default function VendorEdit() {
  const { id } = useParams();
  const { data } = useVendors();
  const updateVendor = useUpdateVendor();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit, reset } = useForm({ defaultValues: { isActive: true } });

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
      navigate("/vendors");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  if (!vendor) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Edit Vendor</Typography>
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
              Update Vendor
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
