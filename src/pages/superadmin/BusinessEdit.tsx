import { Checkbox, FormControlLabel, Grid, MenuItem, Stack, Typography } from "@mui/material";
import TextField from "../../components/CustomTextField";
import SidebarLayout from "../../components/SidebarLayout";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { useToast } from "../../hooks/useToast";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import { useCities, useCountries, useStates } from "../../hooks/useGeo";
import { DEFAULT_CITY, DEFAULT_COUNTRY, DEFAULT_STATE } from "../../constants/locationDefaults";
import { SYSTEM_MODULE_OPTIONS, labelizeModule } from "../../constants/hr";
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
  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm<any>({ defaultValues: { isActive: true, marketId: "" } });
  const country = watch("country");
  const state = watch("state");
  const city = watch("city");
  const businessCategoryId = watch("businessCategoryId");
  const { data: countryOptions = [] } = useCountries();
  const { data: stateOptions = [] } = useStates(country);
  const { data: cityOptions = [] } = useCities(country, state);

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
      const enabledModules = Object.keys(values)
        .filter((k) => k.startsWith("module_") && values[k])
        .map((k) => k.replace("module_", ""));
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
    return <Typography>Loading...</Typography>;
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
                      label={labelizeModule(mod)}
                    />
                  )}
                />
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
