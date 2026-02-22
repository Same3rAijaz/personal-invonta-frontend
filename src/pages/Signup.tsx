import { useForm } from "react-hook-form";
import { Box, Button, Container, Grid, Paper, TextField, Typography, FormControlLabel, Checkbox, Stack, MenuItem } from "@mui/material";
import { useToast } from "../hooks/useToast";
import { api } from "../api/client";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useCities, useCountries, useStates } from "../hooks/useGeo";
import { DEFAULT_CITY, DEFAULT_COUNTRY, DEFAULT_STATE } from "../constants/locationDefaults";

const AVAILABLE_MODULES = ["products", "inventory", "warehouses", "locations", "customers", "vendors", "purchasing", "sales", "hr", "reports"];
const labelize = (value: string) => (value === "hr" ? "HR" : value.charAt(0).toUpperCase() + value.slice(1));

export default function Signup() {
  const { notify } = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      country: DEFAULT_COUNTRY,
      state: DEFAULT_STATE,
      city: DEFAULT_CITY
    }
  });
  const { data: markets } = useQuery({
    queryKey: ["public-markets-signup"],
    queryFn: async () => (await api.get("/public/markets")).data.data
  });
  const marketId = watch("marketId");
  const country = watch("country", DEFAULT_COUNTRY);
  const state = watch("state", DEFAULT_STATE);
  const city = watch("city", DEFAULT_CITY);
  const { data: countryOptions = [] } = useCountries();
  const { data: stateOptions = [] } = useStates(country);
  const { data: cityOptions = [] } = useCities(country, state);
  React.useEffect(() => {
    setValue("country", DEFAULT_COUNTRY, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
    setValue("state", DEFAULT_STATE, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
    setValue("city", DEFAULT_CITY, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [setValue]);
  React.useEffect(() => {
    if (marketId) {
      setValue("marketName", "");
    }
  }, [marketId, setValue]);
  React.useEffect(() => {
    if (!country && countryOptions.includes(DEFAULT_COUNTRY)) {
      setValue("country", DEFAULT_COUNTRY);
    }
  }, [country, countryOptions, setValue]);
  React.useEffect(() => {
    if (!state && stateOptions.includes(DEFAULT_STATE)) {
      setValue("state", DEFAULT_STATE);
    }
  }, [state, stateOptions, setValue]);
  React.useEffect(() => {
    if (!city && cityOptions.includes(DEFAULT_CITY)) {
      setValue("city", DEFAULT_CITY);
    }
  }, [city, cityOptions, setValue]);
  React.useEffect(() => {
    if (stateOptions.length > 0 && state && !stateOptions.some((item: string) => item === state)) {
      setValue("state", "");
      setValue("city", "");
    }
  }, [state, stateOptions, setValue]);
  React.useEffect(() => {
    if (cityOptions.length > 0 && city && !cityOptions.some((item: string) => item === city)) {
      setValue("city", "");
    }
  }, [city, cityOptions, setValue]);

  const onSubmit = async (values: any) => {
    try {
      const requestedModules = Object.keys(values)
        .filter((key) => key.startsWith("module_") && values[key])
        .map((key) => key.replace("module_", ""));
      const payload: any = { ...values };
      Object.keys(payload).forEach((key) => {
        if (key.startsWith("module_")) delete payload[key];
      });

      const selectedMarketId = String(values.marketId || "").trim();
      const requestedMarketName = String(values.marketName || "").trim();
      if (!selectedMarketId && !requestedMarketName) {
        notify("Select a market or request a new market name.", "error");
        return;
      }
      payload.marketId = selectedMarketId || undefined;
      payload.marketName = selectedMarketId ? undefined : requestedMarketName;

      await api.post("/public/signup", { ...payload, requestedModules });
      notify("Signup request submitted. We will review and approve shortly.", "success");
      navigate("/login");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", background: "radial-gradient(circle at top left, rgba(14,165,233,0.18) 0%, #0b1220 40%, #0f172a 100%)" }}>
      <Grid container sx={{ minHeight: "100vh" }}>
        <Grid item xs={12} md={6} sx={{ display: "flex", alignItems: "center", justifyContent: "center", px: { xs: 3, md: 8 }, py: { xs: 6, md: 0 } }}>
          <Box sx={{ maxWidth: 460, textAlign: { xs: "center", md: "left" } }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, justifyContent: { xs: "center", md: "flex-start" } }}>
              <img src="/Invonta.png" alt="Invonta" style={{ width: 52, height: 52 }} />
              <Typography variant="h3" sx={{ color: "#fff", fontWeight: 800 }}>
                Invonta
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ color: "#e2e8f0", mb: 3 }}>
              Launch your inventory system with approvals, access control, and invoices in minutes.
            </Typography>
            <Box sx={{ display: "grid", gap: 1.5, color: "rgba(226,232,240,0.9)", animation: "fadeInUp 700ms ease" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Built for growing teams</Typography>
              <Typography variant="body2" sx={{ color: "rgba(226,232,240,0.75)" }}>
                Set up your business profile and activate only the modules you need today.
              </Typography>
              <Box sx={{ display: "grid", gap: 1, mt: 1, textAlign: { xs: "center", md: "left" } }}>
                <Typography variant="body2">- Approvals and role-based access</Typography>
                <Typography variant="body2">- Multi-location inventory control</Typography>
                <Typography variant="body2">- Reports you can export instantly</Typography>
              </Box>
            </Box>
          </Box>
        </Grid>
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            background: "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
            display: "flex",
            alignItems: "center",
            px: { xs: 3, md: 8 },
            py: { xs: 6, md: 0 }
          }}
        >
          <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 2, boxShadow: "0 18px 40px rgba(15,23,42,0.12)", width: "100%", maxWidth: 640, mx: "auto", backgroundColor: "#ffffff" }}>
            <Typography variant="h4" gutterBottom>Create your shop account</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Tell us a little about your business to get started.
            </Typography>
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="Business Name" {...register("businessName")} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="Contact Name" {...register("contactName")} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="Contact Phone" {...register("contactPhone")} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField select fullWidth label="Market" {...register("marketId")} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}>
                    <MenuItem value="">Not listed / Request market</MenuItem>
                    {(markets || []).map((m: any) => (
                      <MenuItem key={m._id} value={m._id}>{m.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField select fullWidth label="Country" defaultValue={DEFAULT_COUNTRY} {...register("country")} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}>
                    <MenuItem value="">Select Country</MenuItem>
                    {countryOptions.map((item: string) => (
                      <MenuItem key={item} value={item}>{item}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField select fullWidth label="State" defaultValue={DEFAULT_STATE} {...register("state")} disabled={!country} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}>
                    <MenuItem value="">Select State</MenuItem>
                    {stateOptions.map((item: string) => (
                      <MenuItem key={item} value={item}>{item}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField select fullWidth label="City" defaultValue={DEFAULT_CITY} {...register("city")} disabled={!country || !state} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}>
                    <MenuItem value="">Select City</MenuItem>
                    {cityOptions.map((item: string) => (
                      <MenuItem key={item} value={item}>{item}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                {!marketId ? (
                  <Grid item xs={12} md={8}>
                    <TextField fullWidth label="Market Name (request new market)" {...register("marketName")} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }} />
                  </Grid>
                ) : null}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    label="Address"
                    {...register("address")}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Admin Name" {...register("adminName")} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Admin Email" {...register("adminEmail")} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Admin Password" type="password" {...register("adminPassword")} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Referral Code (optional)" {...register("referralCode")} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }} />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Requested Modules</Typography>
                  <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                    {AVAILABLE_MODULES.map((mod) => (
                      <FormControlLabel
                        key={mod}
                        control={
                          <Checkbox
                            {...register(`module_${mod}`)}
                            sx={{
                              color: "#94a3b8",
                              "&.Mui-checked": { color: "#0ea5e9" }
                            }}
                          />
                        }
                        label={labelize(mod)}
                        sx={{
                          m: 0,
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1.5,
                          border: "1px solid rgba(148,163,184,0.35)",
                          backgroundColor: "rgba(248,250,252,0.9)"
                        }}
                      />
                    ))}
                  </Stack>
                </Grid>
                <Grid item xs={12}>
                  <Button type="submit" variant="contained" fullWidth sx={{ py: 1.4, fontWeight: 700, borderRadius: 1 }}>
                    Submit Request
                  </Button>
                </Grid>
              </Grid>
            </Box>
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a", mb: 1 }}>
                Quick actions
              </Typography>
              <Typography sx={{ color: "#475569" }}>
                Already have an account?{" "}
                <Link to="/login" style={{ color: "#0ea5e9", textDecoration: "none" }}>
                  Sign in
                </Link>
              </Typography>
              <Box sx={{ mt: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Link to="/privacy" style={{ color: "#64748b", textDecoration: "none" }}>Privacy Policy</Link>
                <Link to="/terms" style={{ color: "#64748b", textDecoration: "none" }}>Terms of Service</Link>
                <Link to="/tutorial" style={{ color: "#64748b", textDecoration: "none" }}>User Guide</Link>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

