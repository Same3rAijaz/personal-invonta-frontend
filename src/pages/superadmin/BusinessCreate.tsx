import { Box, Button, Paper, Typography, Grid, TextField, MenuItem, Divider, FormControlLabel, Checkbox, Stack } from "@mui/material";
import { useForm } from "react-hook-form";
import { useToast } from "../../hooks/useToast";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import React from "react";
import { useCities, useCountries, useStates } from "../../hooks/useGeo";
import { DEFAULT_CITY, DEFAULT_COUNTRY, DEFAULT_STATE } from "../../constants/locationDefaults";
import { PublicCategoryNode } from "../../api/public";

export default function BusinessCreate() {
  const { notify } = useToast();
  const navigate = useNavigate();
  const client = useQueryClient();
  const { data: markets } = useQuery({
    queryKey: ["markets"],
    queryFn: async () => (await api.get("/superadmin/markets", { params: { page: 1, limit: 1000 } })).data.data
  });
  const { data: categoriesData } = useQuery({
    queryKey: ["superadmin-categories-for-business-create"],
    queryFn: async () => (await api.get("/superadmin/categories", { params: { page: 1, limit: 1000 } })).data.data
  });
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      isActive: true,
      country: DEFAULT_COUNTRY,
      state: DEFAULT_STATE,
      city: DEFAULT_CITY,
      businessCategoryId: ""
    }
  });
  const marketId = watch("marketId");
  const businessCategoryId = watch("businessCategoryId");
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
  const categories = (categoriesData?.items || []) as PublicCategoryNode[];
  const categoriesById = React.useMemo(() => {
    const map = new Map<string, PublicCategoryNode>();
    categories.forEach((item) => map.set(String(item._id), item));
    return map;
  }, [categories]);
  const selectedCategory = React.useMemo(() => {
    if (!businessCategoryId) return null;
    return categoriesById.get(String(businessCategoryId)) || null;
  }, [businessCategoryId, categoriesById]);
  const selectedPathIds = React.useMemo(() => {
    if (!selectedCategory) return [] as string[];
    return [...(selectedCategory.pathIds || []), String(selectedCategory._id)];
  }, [selectedCategory]);
  const childrenByParent = React.useMemo(() => {
    const map = new Map<string, PublicCategoryNode[]>();
    categories.forEach((item) => {
      const key = item.parentId ? String(item.parentId) : "root";
      const list = map.get(key) || [];
      list.push(item);
      map.set(key, list);
    });
    map.forEach((list, key) => map.set(key, [...list].sort((a, b) => String(a.name).localeCompare(String(b.name)))));
    return map;
  }, [categories]);
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

  const mutation = useMutation({
    mutationFn: async (payload: any) => (await api.post("/superadmin/businesses", payload)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["businesses"] })
  });

  const availableModules = ["products", "inventory", "warehouses", "customers", "vendors", "purchasing", "sales", "reports", "udhaar"];
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
            <TextField 
              fullWidth 
              label="Business Name *" 
              {...register("name", { required: "Name is required" })} 
              error={!!errors.name}
              helperText={errors.name?.message as string}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField select fullWidth label="Market (optional)" {...register("marketId")}>
              <MenuItem value="">None</MenuItem>
              {(markets?.items || []).map((m: any) => (
                <MenuItem key={m._id} value={m._id}>{m.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Selected Business Category *"
              value={selectedCategory?.path || (selectedCategory?.pathNames || []).join(" > ") || ""}
              placeholder="Choose business category"
              InputProps={{ readOnly: true }}
              error={!businessCategoryId && !!errors.businessCategoryId}
              helperText={!businessCategoryId && errors.businessCategoryId ? "Business category is required" : undefined}
            />
            {/* hidden input triggers validation on submit */}
            <input type="hidden" {...register("businessCategoryId", { required: "Category is required" })} />
          </Grid>
          {categoryLevels.map((options, level) => (
            <Grid item xs={12} md={4} key={`business-create-category-level-${level}`}>
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
          {!marketId ? (
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Market Name (create if missing)" {...register("marketName")} />
            </Grid>
          ) : null}
          <Grid item xs={12} md={4}>
            <TextField select fullWidth label="Country" {...register("country")}>
              <MenuItem value="">Select Country</MenuItem>
              {countryOptions.map((item: string) => (
                <MenuItem key={item} value={item}>{item}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField select fullWidth label="State" {...register("state")} disabled={!country}>
              <MenuItem value="">Select State</MenuItem>
              {stateOptions.map((item: string) => (
                <MenuItem key={item} value={item}>{item}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField select fullWidth label="City" {...register("city")} disabled={!country || !state}>
              <MenuItem value="">Select City</MenuItem>
              {cityOptions.map((item: string) => (
                <MenuItem key={item} value={item}>{item}</MenuItem>
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
            <TextField 
              fullWidth 
              label="Admin Name *" 
              {...register("adminName", { required: "Admin name is required" })}
              error={!!errors.adminName}
              helperText={errors.adminName?.message as string} 
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField 
              fullWidth 
              label="Admin Email *" 
              type="email"
              {...register("adminEmail", { required: "Admin email is required", pattern: { value: /^\S+@\S+$/i, message: "Invalid email" } })}
              error={!!errors.adminEmail}
              helperText={errors.adminEmail?.message as string} 
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField 
              fullWidth 
              label="Admin Password *" 
              type="password" 
              {...register("adminPassword", { required: "Admin password is required", minLength: { value: 6, message: "Min 6 characters" } })}
              error={!!errors.adminPassword}
              helperText={errors.adminPassword?.message as string}
            />
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
