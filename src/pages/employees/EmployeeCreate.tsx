import { Box, Button, Paper, Typography, Grid, TextField, Divider, FormControlLabel, Checkbox, Stack, IconButton, InputAdornment } from "@mui/material";
import { useForm } from "react-hook-form";
import { useCreateEmployee } from "../../hooks/useEmployees";
import { useToast } from "../../hooks/useToast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useState } from "react";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

export default function EmployeeCreate() {
  const createEmployee = useCreateEmployee();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { business } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const labelize = (value: string) => (value === "hr" ? "HR" : value.charAt(0).toUpperCase() + value.slice(1));
  const { register, handleSubmit, watch, formState: { errors } } = useForm<any>({ defaultValues: { isActive: true } });
  const loginEmail = watch("loginEmail");
  const availableModules = business?.enabledModules?.length
    ? business.enabledModules
    : ["products", "inventory", "warehouses", "customers", "vendors", "purchasing", "sales", "reports"];

  const onSubmit = async (values: any) => {
    try {
      const allowedModules = Object.keys(values)
        .filter((k) => k.startsWith("module_") && values[k])
        .map((k) => k.replace("module_", ""));
      const payload: any = { ...values };
      Object.keys(payload).forEach((key) => {
        if (key.startsWith("module_")) delete payload[key];
      });
      await createEmployee.mutateAsync({
        ...payload,
        allowedModules,
        loginEmail: values.loginEmail || undefined,
        loginPassword: values.loginPassword || undefined
      });
      notify("Employee created", "success");
      navigate("/employees");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Create Employee</Typography>
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
        <Grid container spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Name"
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
              {...register("employeeId", { required: "Employee ID is required" })}
              error={!!errors.employeeId}
              helperText={errors.employeeId?.message as string}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Role" {...register("role")} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Login Email (optional)" {...register("loginEmail")} />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Login Password (optional)"
              type={showPassword ? "text" : "password"}
              {...register("loginPassword", {
                validate: (value) => {
                  if (!loginEmail && !value) return true;
                  if (loginEmail && !value) return "Password is required when login email is provided";
                  if (value && String(value).length < 6) return "Password must be at least 6 characters";
                  return true;
                }
              })}
              error={!!errors.loginPassword}
              helperText={errors.loginPassword?.message as string}
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
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>System Access (RBAC)</Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              {availableModules.map((mod: string) => (
                <FormControlLabel
                  key={mod}
                  control={<Checkbox {...register(`module_${mod}`)} />}
                  label={labelize(mod)}
                />
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel control={<Checkbox defaultChecked {...register("isActive")} />} label="Active" />
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" fullWidth sx={{ py: 1.4, fontWeight: 700 }}>
              Save Employee
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
