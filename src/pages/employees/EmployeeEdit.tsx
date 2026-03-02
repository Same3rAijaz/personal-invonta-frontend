import { Alert, Box, Button, Paper, Typography, Grid, TextField, Divider, FormControlLabel, Checkbox, Stack } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useEmployees, useUpdateEmployee } from "../../hooks/useEmployees";
import { useToast } from "../../hooks/useToast";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function EmployeeEdit() {
  const { id } = useParams();
  const { data } = useEmployees({ page: 1, limit: 1000 });
  const updateEmployee = useUpdateEmployee();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { business, user } = useAuth();
  const labelize = (value: string) => (value === "hr" ? "HR" : value.charAt(0).toUpperCase() + value.slice(1));
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: { isActive: true } });

  const employee = (data?.items || []).find((item: any) => item._id === id);
  const isBusinessAdminEmployee =
    Boolean(employee?.isBusinessAdmin) ||
    String(employee?.role || "").toUpperCase() === "ADMIN" ||
    String(employee?.linkedUserRole || "").toUpperCase() === "ADMIN";
  const canEdit = user?.role === "SUPER_ADMIN" || !isBusinessAdminEmployee;

  useEffect(() => {
    if (employee) {
      reset({
        name: employee.name || "",
        employeeId: employee.employeeId || "",
        role: employee.role || "",
        isActive: employee.isActive ?? true,
        ...Object.fromEntries(
          (employee.allowedModules || []).map((mod: string) => [`module_${mod}`, true])
        )
      });
    }
  }, [employee, reset]);

  const onSubmit = async (values: any) => {
    if (!id) return;
    if (!canEdit) {
      notify("Only super admin can edit business admin employees", "error");
      return;
    }
    try {
      const allowedModules = Object.keys(values)
        .filter((k) => k.startsWith("module_") && values[k])
        .map((k) => k.replace("module_", ""));
      const payload: any = { ...values };
      Object.keys(payload).forEach((key) => {
        if (key.startsWith("module_")) delete payload[key];
      });
      await updateEmployee.mutateAsync({
        id,
        payload: { ...payload, allowedModules }
      });
      notify("Employee updated", "success");
      navigate("/employees");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  if (!employee) {
    return <Typography>Loading...</Typography>;
  }

  const availableModules = business?.enabledModules?.length
    ? business.enabledModules
    : ["products", "inventory", "warehouses", "customers", "vendors", "purchasing", "sales", "hr", "reports"];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Edit Employee</Typography>
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
        {!canEdit ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Editing business admin employees is restricted to super admin only.
          </Alert>
        ) : null}
        <Grid container spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Name"
              disabled={!canEdit}
              {...register("name", { required: "Name is required" })}
              error={!!errors.name}
              helperText={errors.name?.message as string}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Employee ID"
              disabled={!canEdit}
              {...register("employeeId", { required: "Employee ID is required" })}
              error={!!errors.employeeId}
              helperText={errors.employeeId?.message as string}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Role" disabled={!canEdit} {...register("role")} />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>System Access (RBAC)</Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              {availableModules.map((mod: string) => (
                <FormControlLabel
                  key={mod}
                  control={<Checkbox disabled={!canEdit} {...register(`module_${mod}`)} />}
                  label={labelize(mod)}
                />
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel control={<Checkbox disabled={!canEdit} defaultChecked {...register("isActive")} />} label="Active" />
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" disabled={!canEdit} fullWidth sx={{ py: 1.4, fontWeight: 700 }}>
              Update Employee
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
