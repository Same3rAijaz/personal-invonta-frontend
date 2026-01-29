import { Box, Button, Paper, Typography, Grid, TextField, MenuItem, Divider, FormControlLabel, Checkbox, Stack } from "@mui/material";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useToast } from "../../hooks/useToast";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";

const AVAILABLE_MODULES = ["products", "inventory", "warehouses", "locations", "customers", "vendors", "purchasing", "sales", "hr", "reports"];
const labelize = (value: string) => (value === "hr" ? "HR" : value.charAt(0).toUpperCase() + value.slice(1));

export default function BusinessEdit() {
  const { id } = useParams();
  const { notify } = useToast();
  const navigate = useNavigate();
  const client = useQueryClient();
  const { data: markets } = useQuery({
    queryKey: ["markets"],
    queryFn: async () => (await api.get("/superadmin/markets", { params: { page: 1, limit: 1000 } })).data.data
  });
  const { data: businesses } = useQuery({
    queryKey: ["businesses"],
    queryFn: async () => (await api.get("/superadmin/businesses", { params: { page: 1, limit: 1000 } })).data.data
  });
  const { register, handleSubmit, reset, control } = useForm({ defaultValues: { isActive: true, marketId: "" } });

  const business = (businesses?.items || []).find((b: any) => b._id === id);

  useEffect(() => {
    if (business) {
      const moduleDefaults = Object.fromEntries(
        AVAILABLE_MODULES.map((mod) => [`module_${mod}`, (business.enabledModules || []).includes(mod)])
      );
      const normalizedMarketId =
        typeof business.marketId === "object" && business.marketId?._id
          ? String(business.marketId._id)
          : business.marketId
          ? String(business.marketId)
          : "";
      reset({
        name: business.name || "",
        marketId: normalizedMarketId,
        contactName: business.contactName || "",
        contactPhone: business.contactPhone || "",
        address: business.address || "",
        isActive: business.isActive ?? true,
        ...moduleDefaults
      });
    }
  }, [business, reset]);

  const mutation = useMutation({
    mutationFn: async (payload: any) => (await api.patch(`/superadmin/businesses/${id}`, payload)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["businesses"] })
  });

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
      notify("Business updated", "success");
      navigate("/superadmin/businesses");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  if (!business) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Edit Business</Typography>
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
        <Grid container spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Business Name" {...register("name")} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="marketId"
              control={control}
              render={({ field }) => (
                <TextField select fullWidth label="Market (optional)" {...field} value={field.value || ""}>
                  <MenuItem value="">None</MenuItem>
                  {(markets?.items || []).map((m: any) => (
                    <MenuItem key={m._id} value={m._id}>{m.name}</MenuItem>
                  ))}
                </TextField>
              )}
            />
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
              {AVAILABLE_MODULES.map((mod) => (
                <Controller
                  key={mod}
                  name={`module_${mod}` as const}
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                      label={labelize(mod)}
                    />
                  )}
                />
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel control={<Checkbox defaultChecked {...register("isActive")} />} label="Active" />
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" fullWidth sx={{ py: 1.4, fontWeight: 700 }}>
              Update Business
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
