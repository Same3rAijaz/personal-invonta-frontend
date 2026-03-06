import { Box, Button, Checkbox, FormControlLabel, Grid, MenuItem, Paper, TextField, Typography } from "@mui/material";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useSuperAdminCategories, useUpdateCategory } from "../../hooks/useCategories";
import { useToast } from "../../hooks/useToast";

export default function CategoryEdit() {
  const ROOT_VALUE = "__ROOT__";
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useToast();
  const updateCategory = useUpdateCategory();
  const { data } = useSuperAdminCategories({ page: 1, limit: 1000 });
  const categories = data?.items || [];
  const category = categories.find((item: any) => item._id === id);
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({ defaultValues: { name: "", parentId: ROOT_VALUE, isActive: true } });

  useEffect(() => {
    if (!category) return;
    reset({
      name: category.name || "",
      parentId: category.parentId || ROOT_VALUE,
      isActive: category.isActive ?? true
    });
  }, [category, reset]);

  const onSubmit = async (values: any) => {
    if (!id) return;
    try {
      await updateCategory.mutateAsync({
        id,
        payload: {
          name: values.name,
          parentId: values.parentId && values.parentId !== ROOT_VALUE ? values.parentId : null,
          isActive: Boolean(values.isActive)
        }
      });
      notify("Category updated", "success");
      navigate("/superadmin/categories");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  if (!category) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.6 }}>Edit Category</Typography>
      <Typography color="text.secondary" sx={{ mb: 2.2 }}>
        Reorganize the category hierarchy without breaking parent-child structure.
      </Typography>
      <Paper sx={{ p: 3, borderRadius: 4, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
        <Grid container spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid item xs={12} md={6}>
            <TextField 
              fullWidth 
              label="Category Name *" 
              {...register("name", { required: "Name is required" })}
              error={!!errors.name}
              helperText={errors.name?.message as string} 
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="parentId"
              control={control}
              render={({ field }) => (
                <TextField
                  select
                  fullWidth
                  label="Parent Category"
                  value={field.value || ROOT_VALUE}
                  onChange={(event) => field.onChange(event.target.value)}
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (value) => {
                      if (!value || value === ROOT_VALUE) return "Root Category";
                      const match = categories.find((item: any) => String(item._id) === String(value));
                      return match ? (match.pathNames || [match.name]).join(" > ") : "Root Category";
                    }
                  }}
                >
                    <MenuItem value={ROOT_VALUE}>Root Category</MenuItem>
                    {categories
                      .filter((item: any) => item._id !== id)
                      .map((item: any) => (
                        <MenuItem key={item._id} value={item._id}>
                          {(item.pathNames || [item.name]).join(" > ")}
                        </MenuItem>
                      ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel control={<Checkbox defaultChecked {...register("isActive")} />} label="Active" />
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" sx={{ px: 3.2, py: 1.2, borderRadius: 2.5, fontWeight: 700 }}>
              Update Category
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
