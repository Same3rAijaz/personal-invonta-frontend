import { Box, Button, Paper, Typography, Grid, TextField, Divider, FormControlLabel, Checkbox } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useWarehouses, useUpdateWarehouse } from "../../hooks/useWarehouses";
import { useToast } from "../../hooks/useToast";
import { useNavigate, useParams } from "react-router-dom";

export default function WarehouseEdit() {
  const { id } = useParams();
  const { data } = useWarehouses({ page: 1, limit: 1000 });
  const updateWarehouse = useUpdateWarehouse();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>({ defaultValues: { isActive: true } });

  const warehouse = (data?.items || []).find((item: any) => item._id === id);

  useEffect(() => {
    if (warehouse) {
      reset({
        name: warehouse.name || "",
        address: warehouse.address || "",
        isActive: warehouse.isActive ?? true
      });
    }
  }, [warehouse, reset]);

  const onSubmit = async (values: any) => {
    if (!id) return;
    try {
      await updateWarehouse.mutateAsync({ id, payload: values });
      notify("Warehouse updated", "success");
      navigate("/warehouses");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  if (!warehouse) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Edit Warehouse</Typography>
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
        <Grid container spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
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
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" fullWidth sx={{ py: 1.4, fontWeight: 700 }}>
              Update Warehouse
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
