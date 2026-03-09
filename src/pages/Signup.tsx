import { useForm } from "react-hook-form";
import { Box, Button, Container, Grid, IconButton, InputAdornment, Paper, TextField, Typography, FormControlLabel, Checkbox, Stack, MenuItem } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useToast } from "../hooks/useToast";
import { api } from "../api/client";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { PublicCategoryNode } from "../api/public";
import { useCities, useCountries, useStates } from "../hooks/useGeo";
import { DEFAULT_CITY, DEFAULT_COUNTRY, DEFAULT_STATE } from "../constants/locationDefaults";

const AVAILABLE_MODULES = ["products", "inventory", "warehouses", "customers", "vendors", "purchasing", "sales", "reports"];
const labelize = (value: string) => (value === "hr" ? "HR" : value.charAt(0).toUpperCase() + value.slice(1));
const REQUEST_MARKET_VALUE = "__REQUEST_MARKET__";

export default function Signup() {
  const { notify } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<any>({
    defaultValues: {
      marketId: REQUEST_MARKET_VALUE,
      country: DEFAULT_COUNTRY,
      state: DEFAULT_STATE,
      city: DEFAULT_CITY
    }
  });
  const { data: markets } = useQuery({
    queryKey: ["public-markets-signup"],
    queryFn: async () => (await api.get("/public/markets")).data.data
  });
  const { data: categories = [] } = useQuery<PublicCategoryNode[]>({
    queryKey: ["public-categories-signup"],
    queryFn: async () => (await api.get("/public/products/categories")).data.data || []
  });
  const marketId = watch("marketId");
  const businessCategoryId = watch("businessCategoryId");
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
    if (marketId && marketId !== REQUEST_MARKET_VALUE) {
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

  const categoriesById = React.useMemo(() => {
    const map = new Map<string, PublicCategoryNode>();
    (categories || []).forEach((item) => map.set(String(item._id), item));
    return map;
  }, [categories]);

  const selectedCategory = React.useMemo(() => {
    if (!businessCategoryId) return null;
    return categoriesById.get(String(businessCategoryId)) || null;
  }, [businessCategoryId, categoriesById]);

  const childrenByParent = React.useMemo(() => {
    const map = new Map<string, PublicCategoryNode[]>();
    (categories || []).forEach((item) => {
      const key = item.parentId ? String(item.parentId) : "root";
      const list = map.get(key) || [];
      list.push(item);
      map.set(key, list);
    });
    map.forEach((list, key) => map.set(key, [...list].sort((a, b) => String(a.name).localeCompare(String(b.name)))));
    return map;
  }, [categories]);

  const selectedPathIds = React.useMemo(() => {
    if (!selectedCategory) return [] as string[];
    const parentPathIds = selectedCategory.pathIds || [];
    return [...parentPathIds, String(selectedCategory._id)];
  }, [selectedCategory]);

  const categoryLevels = React.useMemo(() => {
    const levels: PublicCategoryNode[][] = [];
    let parentKey = "root";
    for (let level = 0; level < 10; level += 1) {
      const options = childrenByParent.get(parentKey) || [];
      if (options.length === 0) break;
      levels.push(options);
      const selectedId = selectedPathIds[level];
      if (!selectedId) break;
      parentKey = selectedId;
    }
    return levels;
  }, [childrenByParent, selectedPathIds]);
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

      const selectedMarketIdRaw = String(values.marketId || "").trim();
      const selectedMarketId = selectedMarketIdRaw === REQUEST_MARKET_VALUE ? "" : selectedMarketIdRaw;
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
    <Box sx={{ height: "100vh", display: "flex", overflow: "hidden", background: "radial-gradient(circle at top left, rgba(14,165,233,0.18) 0%, #0b1220 40%, #0f172a 100%)" }}>
      <Grid container sx={{ height: "100vh" }}>
        <Grid item xs={12} md={6} sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", justifyContent: "center", px: { xs: 3, md: 8 }, py: { xs: 6, md: 0 }, height: "100vh", overflow: "hidden" }}>
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
                <Typography variant="body2">- Inventory control and stock tracking</Typography>
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
            alignItems: "flex-start",
            px: { xs: 3, md: 8 },
            py: { xs: 4, md: 4 },
            height: "100vh",
            overflowY: "auto"
          }}
        >
          <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 2, boxShadow: "0 18px 40px rgba(15,23,42,0.12)", width: "100%", maxWidth: 640, mx: "auto", backgroundColor: "#ffffff" }}>
            <Typography variant="h4" gutterBottom>Create your shop account</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Tell us a little about your business to get started.
            </Typography>
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <input type="hidden" {...register("businessCategoryId")} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField 
                    fullWidth 
                    label="Business Name *" 
                    {...register("businessName", { required: "Business Name is required" })} 
                    error={!!errors.businessName}
                    helperText={errors.businessName?.message as string}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }} 
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField 
                    fullWidth 
                    label="Contact Name *" 
                    {...register("contactName", { required: "Contact Name is required" })} 
                    error={!!errors.contactName}
                    helperText={errors.contactName?.message as string}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }} 
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField 
                    fullWidth 
                    label="Contact Phone *" 
                    {...register("contactPhone", { required: "Contact Phone is required" })} 
                    error={!!errors.contactPhone}
                    helperText={errors.contactPhone?.message as string}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }} 
                  />
                </Grid>
                <Grid item xs={12} md={12}>
                  <Box
                    sx={{
                      minHeight: 40,
                      px: 1.5,
                      py: 1,
                      borderRadius: 1,
                      border: "1px solid rgba(148,163,184,0.35)",
                      backgroundColor: "rgba(248,250,252,0.9)",
                      display: "flex",
                      alignItems: "center",
                      gap: 1
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, mr: 0.5 }}>
                      Selected Category:
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 600 }}>
                      {selectedCategory?.path || (selectedCategory?.pathNames || []).join(" > ") || "None selected"}
                    </Typography>
                  </Box>
                </Grid>
                {categoryLevels.map((options, level) => (
                  <Grid item xs={12} md={4} key={`signup-category-level-${level}`}>
                    <TextField
                      select
                      fullWidth
                      label={level === 0 ? "Business Category" : `Sub Category ${level}`}
                      value={selectedPathIds[level] || ""}
                      onChange={(event) => {
                        const selectedId = String(event.target.value || "");
                        const nextPath = selectedPathIds.slice(0, level);
                        if (selectedId) nextPath[level] = selectedId;
                        const finalId = nextPath[nextPath.length - 1] || "";
                        setValue("businessCategoryId", finalId, { shouldDirty: true, shouldValidate: true });
                      }}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
                    >
                      <MenuItem value="">None</MenuItem>
                      {options.map((item) => (
                        <MenuItem key={item._id} value={item._id}>
                          {item.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                ))}
                <Grid item xs={12} md={4}>
                  <TextField select fullWidth label="Market" {...register("marketId")} value={marketId || ""} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}>
                    <MenuItem value={REQUEST_MARKET_VALUE}>Not listed / Request market</MenuItem>
                    {(markets || []).map((m: any) => (
                      <MenuItem key={m._id} value={m._id}>{m.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField select fullWidth label="Country" {...register("country")} value={country || ""} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}>
                    <MenuItem value="">Select Country</MenuItem>
                    {countryOptions.map((item: string) => (
                      <MenuItem key={item} value={item}>{item}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField select fullWidth label="State" {...register("state")} disabled={!country} value={state || ""} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}>
                    <MenuItem value="">Select State</MenuItem>
                    {stateOptions.map((item: string) => (
                      <MenuItem key={item} value={item}>{item}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField select fullWidth label="City" {...register("city")} disabled={!country || !state} value={city || ""} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}>
                    <MenuItem value="">Select City</MenuItem>
                    {cityOptions.map((item: string) => (
                      <MenuItem key={item} value={item}>{item}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                {marketId === REQUEST_MARKET_VALUE ? (
                  <Grid item xs={12} md={8}>
                    <TextField fullWidth label="Market Name (request new market)" {...register("marketName")} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }} />
                  </Grid>
                ) : null}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    label="Address *"
                    {...register("address", { required: "Address is required" })}
                    error={!!errors.address}
                    helperText={errors.address?.message as string}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField 
                    fullWidth 
                    label="Admin Name *" 
                    {...register("adminName", { required: "Admin Name is required" })} 
                    error={!!errors.adminName}
                    helperText={errors.adminName?.message as string}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }} 
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField 
                    fullWidth 
                    label="Admin Email *" 
                    type="email"
                    {...register("adminEmail", { required: "Admin Email is required", pattern: { value: /^\S+@\S+$/i, message: "Invalid email schema" } })} 
                    error={!!errors.adminEmail}
                    helperText={errors.adminEmail?.message as string}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }} 
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Admin Password *"
                    type={showPassword ? "text" : "password"}
                    {...register("adminPassword", { required: "Admin Password is required", minLength: { value: 6, message: "Minimum 6 characters" } })}
                    error={!!errors.adminPassword}
                    helperText={errors.adminPassword?.message as string}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton edge="end" onClick={() => setShowPassword((prev) => !prev)}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
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

