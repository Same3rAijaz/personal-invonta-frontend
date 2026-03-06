import { Box, Button, Paper, Typography, Grid, TextField, Divider, FormControlLabel, Checkbox } from "@mui/material";
import { useForm } from "react-hook-form";
import { useCreateWarehouse } from "../../hooks/useWarehouses";
import { useToast } from "../../hooks/useToast";
import { useNavigate } from "react-router-dom";

export default function WarehouseCreate() {
  const createWarehouse = useCreateWarehouse();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<any>({ defaultValues: { isActive: true } });

  const onSubmit = async (values: any) => {
    try {
      await createWarehouse.mutateAsync(values);
      notify("Warehouse created", "success");
      navigate("/warehouses");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Create Warehouse</Typography>
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
              Save Warehouse
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}