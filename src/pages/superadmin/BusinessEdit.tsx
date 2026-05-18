import { Checkbox, FormControlLabel, Grid, MenuItem, Stack, Typography, Box, CircularProgress, Tooltip } from "@mui/material";
import TextField from "../../components/CustomTextField";
import SidebarLayout from "../../components/SidebarLayout";
import { useEffect, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useToast } from "../../hooks/useToast";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import { useCities, useCountries, useStates } from "../../hooks/useGeo";
import { DEFAULT_CITY, DEFAULT_COUNTRY, DEFAULT_STATE } from "../../constants/locationDefaults";
import { SYSTEM_MODULE_OPTIONS, labelizeModule } from "../../constants/hr";
import { expandEnabledModules, applyModuleToggle, prerequisitesSentence, normModuleId } from "../../constants/moduleDependencies";
import { PublicCategoryNode } from "../../api/public";

const AVAILABLE_MODULES = [...SYSTEM_MODULE_OPTIONS];

export default function BusinessEdit({ explicitId, onSuccess, onCancel }: { explicitId?: string, onSuccess?: () => void, onCancel?: () => void } = {}) {
  const params = useParams();
  const id = explicitId || params.id;
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
  const { data: categoriesData } = useQuery({
    queryKey: ["superadmin-categories-for-business-edit"],
    queryFn: async () => (await api.get("/superadmin/categories", { params: { page: 1, limit: 1000 } })).data.data
  });
  const { register, handleSubmit, reset, control, watch, setValue, getValues, formState: { errors } } = useForm<any>({ defaultValues: { isActive: true, marketId: "" } });
  const country = watch("country");
  const state = watch("state");
  const city = watch("city");
  const businessCategoryId = watch("businessCategoryId");
  const { data: countryOptions = [] } = useCountries();
  const { data: stateOptions = [] } = useStates(country);
  const { data: cityOptions = [] } = useCities(country, state);

  const moduleFieldNames = useMemo(() => AVAILABLE_MODULES.map((m) => `module_${m}`), []);
  const moduleChecks = useWatch({ control, name: moduleFieldNames }) as boolean[] | undefined;

  const business = (businesses?.items || []).find((b: any) => b._id === id);

  useEffect(() => {
    if (business) {
      const saved = new Set((business.enabledModules || []).map(normModuleId));
      const expanded = expandEnabledModules(saved);
      const moduleDefaults = Object.fromEntries(
        AVAILABLE_MODULES.map((mod) => [`module_${mod}`, expanded.has(mod)])
      );
      const normalizedMarketId =
        typeof business.marketId === "object" && business.marketId?._id
          ? String(business.marketId._id)
          : business.marketId
          ? String(business.marketId)
          : "";
      const marketCountry =
        typeof business.marketId === "object" && business.marketId?.country
          ? String(business.marketId.country).trim()
          : "";
      const marketState =
        typeof business.marketId === "object" && business.marketId?.state
          ? String(business.marketId.state).trim()
          : "";
      const marketCity =
        typeof business.marketId === "object" && business.marketId?.city
          ? String(business.marketId.city).trim()
          : "";
      const normalizedCountry = String(business.country || "").trim() || marketCountry || DEFAULT_COUNTRY;
      const normalizedState = String(business.state || "").trim() || marketState || DEFAULT_STATE;
      const normalizedCity = String(business.city || "").trim() || marketCity || DEFAULT_CITY;
      reset({
        name: business.name || "",
        marketId: normalizedMarketId,
        country: normalizedCountry,
        state: normalizedState,
        city: normalizedCity,
        contactName: business.contactName || "",
        contactPhone: business.contactPhone || "",
        address: business.address || "",
        businessCategoryId: business.businessCategoryId || "",
        isActive: business.isActive ?? true,
        ...moduleDefaults
      });
    }
  }, [business, reset]);

  useEffect(() => {
    if (stateOptions.length > 0 && state && !stateOptions.some((item: string) => item === state)) {
      setValue("state", "");
      setValue("city", "");
    }
    if (cityOptions.length > 0 && city && !cityOptions.some((item: string) => item === city)) {
      setValue("city", "");
    }
  }, [state, city, stateOptions, cityOptions, setValue]);
  const hasCountryOption = useMemo(() => countryOptions.some((item: string) => item === country), [countryOptions, country]);
  const hasStateOption = useMemo(() => stateOptions.some((item: string) => item === state), [stateOptions, state]);
  const hasCityOption = useMemo(() => cityOptions.some((item: string) => item === city), [cityOptions, city]);
  const categories = (categoriesData?.items || []) as PublicCategoryNode[];
  const categoriesById = useMemo(() => {
    const map = new Map<string, PublicCategoryNode>();
    categories.forEach((item) => map.set(String(item._id), item));
    return map;
  }, [categories]);
  const selectedCategory = useMemo(() => {
    if (!businessCategoryId) return null;
    return categoriesById.get(String(businessCategoryId)) || null;
  }, [businessCategoryId, categoriesById]);
  const selectedPathIds = useMemo(() => {
    if (!selectedCategory) return [] as string[];
    return [...(selectedCategory.pathIds || []), String(selectedCategory._id)];
  }, [selectedCategory]);
  const childrenByParent = useMemo(() => {
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
  const categoryLevels = useMemo(() => {
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

  const updateBusiness = useMutation({
    mutationFn: async (payload: any) => (await api.patch(`/superadmin/businesses/${id}`, payload)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["businesses"] })
  });

  const onSubmit = async (values: any) => {
    try {
      const enabledModules = [
        ...expandEnabledModules(
          new Set(
            Object.keys(values)
              .filter((k) => k.startsWith("module_") && values[k])
              .map((k) => normModuleId(k.replace("module_", "")))
          )
        )
      ];
      const payload: any = { ...values };
      Object.keys(payload).forEach((key) => {
        if (key.startsWith("module_")) delete payload[key];
      });
      await updateBusiness.mutateAsync({ ...payload, enabledModules });
      notify("Business updated", "success");
      if (onSuccess) onSuccess(); else navigate("/superadmin/businesses");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  if (!business) {
    return (
      <SidebarLayout title="Edit Business" onCancel={onCancel} showFooter={false} submitLabel="">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: { xs: 280, sm: 360 },
            gap: 2,
            py: 6,
            borderRadius: 2,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            background: (theme) =>
              theme.palette.mode === "dark" ? "rgba(15,23,42,0.45)" : "rgba(248,250,252,0.9)"
          }}
        >
          <CircularProgress size={44} thickness={4} sx={{ color: "primary.main" }} />
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            Loading business…
          </Typography>
        </Box>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title="Edit Business" onCancel={onCancel} isSubmitting={updateBusiness.isPending} submitLabel="Update Business">

        <Grid container spacing={2} component="form" id="sidebar-form" onSubmit={handleSubmit(onSubmit)}>
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
            <TextField select fullWidth label="Country" {...register("country")} value={country || ""}>
              <MenuItem value="">Select Country</MenuItem>
              {country && !hasCountryOption ? <MenuItem value={country}>{country}</MenuItem> : null}
              {countryOptions.map((item: string) => (
                <MenuItem key={item} value={item}>{item}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField select fullWidth label="State" {...register("state")} disabled={!country} value={state || ""}>
              <MenuItem value="">Select State</MenuItem>
              {state && !hasStateOption ? <MenuItem value={state}>{state}</MenuItem> : null}
              {stateOptions.map((item: string) => (
                <MenuItem key={item} value={item}>{item}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField select fullWidth label="City" {...register("city")} disabled={!country || !state} value={city || ""}>
              <MenuItem value="">Select City</MenuItem>
              {city && !hasCityOption ? <MenuItem value={city}>{city}</MenuItem> : null}
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
            <Grid item xs={12} md={4} key={`business-edit-category-level-${level}`}>
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
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Enabled Modules</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
              Turning on a module enables its prerequisites automatically. Turning one off also disables modules that depend on it.
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              {AVAILABLE_MODULES.map((mod, idx) => (
                <Tooltip
                  key={mod}
                  title={prerequisitesSentence(mod) || "No prerequisite modules — safe to toggle alone"}
                  placement="top"
                  arrow
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(moduleChecks?.[idx] ?? getValues(`module_${mod}`))}
                        onChange={(e) => {
                          const current = new Set(
                            AVAILABLE_MODULES.filter((id) => !!getValues(`module_${id}`))
                          );
                          const next = applyModuleToggle(current, mod, e.target.checked);
                          AVAILABLE_MODULES.forEach((id) =>
                            setValue(`module_${id}`, next.has(id), { shouldDirty: true })
                          );
                        }}
                      />
                    }
                    label={labelizeModule(mod)}
                  />
                </Tooltip>
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel control={<Checkbox defaultChecked {...register("isActive")} />} label="Active" />
          </Grid>
          
        </Grid>
    </SidebarLayout>
  );
}
