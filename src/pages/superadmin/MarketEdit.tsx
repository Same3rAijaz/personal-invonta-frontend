import { Box, Button, Paper, Typography, Grid, TextField, Divider, FormControlLabel, Checkbox } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "../../hooks/useToast";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";

export default function MarketEdit() {
  const { id } = useParams();
  const { notify } = useToast();
  const navigate = useNavigate();
  const client = useQueryClient();
  const { data: markets } = useQuery({
    queryKey: ["markets"],
    queryFn: async () => (await api.get("/superadmin/markets")).data.data
  });
  const { register, handleSubmit, reset } = useForm({ defaultValues: { isActive: true } });

  const market = (markets || []).find((m: any) => m._id === id);

  useEffect(() => {
    if (market) {
      reset({
        name: market.name || "",
        city: market.city || "",
        state: market.state || "",
        isActive: market.isActive ?? true
      });
    }
  }, [market, reset]);

  const mutation = useMutation({
    mutationFn: async (payload: any) => (await api.patch(`/superadmin/markets/${id}`, payload)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["markets"] })
  });

  const onSubmit = async (values: any) => {
    try {
      await mutation.mutateAsync(values);
      notify("Market updated", "success");
      navigate("/superadmin/markets");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  if (!market) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Edit Market</Typography>
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
        <Grid container spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Name" {...register("name")} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="City" {...register("city")} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="State" {...register("state")} />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel control={<Checkbox defaultChecked {...register("isActive")} />} label="Active" />
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" fullWidth sx={{ py: 1.4, fontWeight: 700 }}>
              Update Market
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
