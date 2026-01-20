import { Box, Button, Paper, Typography, Grid, TextField, MenuItem, Divider, FormControlLabel, Checkbox } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useLocations, useUpdateLocation } from "../../hooks/useLocations";
import { useWarehouses } from "../../hooks/useWarehouses";
import { useToast } from "../../hooks/useToast";
import { useNavigate, useParams } from "react-router-dom";

export default function LocationEdit() {
  const { id } = useParams();
  const { data } = useLocations();
  const { data: warehouses } = useWarehouses();
  const updateLocation = useUpdateLocation();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit, reset } = useForm({ defaultValues: { isActive: true } });

  const location = (data?.items || []).find((item: any) => item._id === id);

  useEffect(() => {
    if (location) {
      reset({
        warehouseId: location.warehouseId || "",
        code: location.code || "",
        description: location.description || "",
        isActive: location.isActive ?? true
      });
    }
  }, [location, reset]);

  const onSubmit = async (values: any) => {
    if (!id) return;
    try {
      await updateLocation.mutateAsync({ id, payload: values });
      notify("Location updated", "success");
      navigate("/locations");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  if (!location) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Edit Location</Typography>
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
        <Grid container spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid item xs={12} md={4}>
            <TextField select fullWidth label="Warehouse" {...register("warehouseId")}>
              {(warehouses?.items || []).map((w: any) => (
                <MenuItem key={w._id} value={w._id}>{w.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Code" {...register("code")} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Description" {...register("description")} />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel control={<Checkbox defaultChecked {...register("isActive")} />} label="Active" />
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" fullWidth sx={{ py: 1.4, fontWeight: 700 }}>
              Update Location
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
