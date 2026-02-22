import { Box, Button, Checkbox, FormControlLabel, Grid, Paper, TextField, Typography } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useSuperAdminCategories, useUpdateCategory } from "../../hooks/useCategories";
import { useToast } from "../../hooks/useToast";

export default function CategoryEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useToast();
  const updateCategory = useUpdateCategory();
  const { data } = useSuperAdminCategories({ page: 1, limit: 1000 });
  const category = (data?.items || []).find((item: any) => item._id === id);
  const { register, handleSubmit, reset } = useForm({ defaultValues: { name: "", subcategoriesText: "", isActive: true } });

  useEffect(() => {
    if (!category) return;
    reset({
      name: category.name || "",
      isActive: category.isActive ?? true,
      subcategoriesText: (category.subcategories || []).map((x: any) => x.name).join(", ")
    });
  }, [category, reset]);

  const onSubmit = async (values: any) => {
    if (!id) return;
    const subcategories = String(values.subcategoriesText || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((name) => ({ name, isActive: true }));
    try {
      await updateCategory.mutateAsync({
        id,
        payload: {
          name: values.name,
          isActive: Boolean(values.isActive),
          subcategories
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
      <Typography variant="h5" gutterBottom>Edit Category</Typography>
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
        <Grid container spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Category Name" {...register("name")} />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Sub Categories (comma separated)"
              placeholder="Smartphones, Accessories, Tablets"
              {...register("subcategoriesText")}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel control={<Checkbox defaultChecked {...register("isActive")} />} label="Active" />
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained">
              Update Category
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
