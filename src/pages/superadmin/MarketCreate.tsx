import { Box, Button, Paper, Typography, Grid, TextField, Divider, FormControlLabel, Checkbox } from "@mui/material";
import { useForm } from "react-hook-form";
import { useToast } from "../../hooks/useToast";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import React from "react";
import { MenuItem } from "@mui/material";
import { useCities, useCountries, useStates } from "../../hooks/useGeo";
import { DEFAULT_CITY, DEFAULT_COUNTRY, DEFAULT_STATE } from "../../constants/locationDefaults";

export default function MarketCreate() {
  const { notify } = useToast();
  const navigate = useNavigate();
  const client = useQueryClient();
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      isActive: true,
      country: DEFAULT_COUNTRY,
      state: DEFAULT_STATE,
      city: DEFAULT_CITY
    }
  });
  const country = watch("country");
  const state = watch("state");
  const city = watch("city");
  const { data: countryOptions = [] } = useCountries();
  const { data: stateOptions = [] } = useStates(country);
  const { data: cityOptions = [] } = useCities(country, state);
  React.useEffect(() => {
    if (state && !stateOptions.some((item: string) => item === state)) {
      setValue("state", "");
      setValue("city", "");
    }
  }, [state, stateOptions, setValue]);
  React.useEffect(() => {
    if (city && !cityOptions.some((item: string) => item === city)) {
      setValue("city", "");
    }
  }, [city, cityOptions, setValue]);

  const mutation = useMutation({
    mutationFn: async (payload: any) => (await api.post("/superadmin/markets", payload)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["markets"] })
  });

  const onSubmit = async (values: any) => {
    try {
      await mutation.mutateAsync(values);
      notify("Market created", "success");
      navigate("/superadmin/markets");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Create Market</Typography>
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
        <Grid container spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid item xs={12} md={3}>
            <TextField fullWidth label="Name" {...register("name")} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField select fullWidth label="Country" {...register("country")}>
              <MenuItem value="">Select Country</MenuItem>
              {countryOptions.map((item: string) => (
                <MenuItem key={item} value={item}>{item}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField select fullWidth label="State" {...register("state")} disabled={!country}>
              <MenuItem value="">Select State</MenuItem>
              {stateOptions.map((item: string) => (
                <MenuItem key={item} value={item}>{item}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField select fullWidth label="City" {...register("city")} disabled={!country || !state}>
              <MenuItem value="">Select City</MenuItem>
              {cityOptions.map((item: string) => (
                <MenuItem key={item} value={item}>{item}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel control={<Checkbox defaultChecked {...register("isActive")} />} label="Active" />
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" fullWidth sx={{ py: 1.4, fontWeight: 700 }}>
              Save Market
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
