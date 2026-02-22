import { Box, Button, Checkbox, FormControlLabel, Grid, Paper, TextField, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useCreateCategory } from "../../hooks/useCategories";
import { useToast } from "../../hooks/useToast";

export default function CategoryCreate() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const createCategory = useCreateCategory();
  const { register, handleSubmit } = useForm({ defaultValues: { isActive: true, subcategoriesText: "" } });

  const onSubmit = async (values: any) => {
    const subcategories = String(values.subcategoriesText || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((name) => ({ name, isActive: true }));
    try {
      await createCategory.mutateAsync({
        name: values.name,
        isActive: Boolean(values.isActive),
        subcategories
      });
      notify("Category created", "success");
      navigate("/superadmin/categories");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Create Category</Typography>
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
              Save Category
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
