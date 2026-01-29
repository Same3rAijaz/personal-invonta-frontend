import { Box, Button, Paper, Typography, Grid, TextField, MenuItem, Divider, FormControlLabel, Checkbox, Stack } from "@mui/material";
import { useForm } from "react-hook-form";
import { useToast } from "../../hooks/useToast";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";

export default function BusinessCreate() {
  const { notify } = useToast();
  const navigate = useNavigate();
  const client = useQueryClient();
  const { data: markets } = useQuery({
    queryKey: ["markets"],
    queryFn: async () => (await api.get("/superadmin/markets", { params: { page: 1, limit: 1000 } })).data.data
  });
  const { register, handleSubmit } = useForm({ defaultValues: { isActive: true } });

  const mutation = useMutation({
    mutationFn: async (payload: any) => (await api.post("/superadmin/businesses", payload)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["businesses"] })
  });

  const availableModules = ["products", "inventory", "warehouses", "locations", "customers", "vendors", "purchasing", "sales", "hr", "reports", "udhaar"];
  const labelize = (value: string) => (value === "hr" ? "HR" : value.charAt(0).toUpperCase() + value.slice(1));

  const onSubmit = async (values: any) => {
    try {
      const enabledModules = Object.keys(values)
        .filter((k) => k.startsWith("module_") && values[k])
        .map((k) => k.replace("module_", ""));
      const payload: any = { ...values };
      Object.keys(payload).forEach((key) => {
        if (key.startsWith("module_")) delete payload[key];
      });
      await mutation.mutateAsync({ ...payload, enabledModules });
      notify("Business created", "success");
      navigate("/superadmin/businesses");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Create Business</Typography>
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
        <Grid container spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Business Name" {...register("name")} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField select fullWidth label="Market (optional)" {...register("marketId")}>
              <MenuItem value="">None</MenuItem>
              {(markets?.items || []).map((m: any) => (
                <MenuItem key={m._id} value={m._id}>{m.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Contact Name" {...register("contactName")} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Contact Phone" {...register("contactPhone")} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Address" {...register("address")} />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Enabled Modules</Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              {availableModules.map((mod) => (
                <FormControlLabel
                  key={mod}
                  control={<Checkbox {...register(`module_${mod}`)} />}
                  label={labelize(mod)}
                />
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Admin Name" {...register("adminName")} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Admin Email" {...register("adminEmail")} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Admin Password" type="password" {...register("adminPassword")} />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel control={<Checkbox defaultChecked {...register("isActive")} />} label="Active" />
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" fullWidth sx={{ py: 1.4, fontWeight: 700 }}>
              Save Business
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
