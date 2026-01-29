import { Box, Button, Paper, Typography, Grid, TextField, MenuItem, Divider, FormControlLabel, Checkbox, Stack } from "@mui/material";
import { useForm } from "react-hook-form";
import { useCreateEmployee } from "../../hooks/useEmployees";
import { useWarehouses } from "../../hooks/useWarehouses";
import { useToast } from "../../hooks/useToast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function EmployeeCreate() {
  const { data: warehouses } = useWarehouses({ page: 1, limit: 1000 });
  const createEmployee = useCreateEmployee();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { business } = useAuth();
  const labelize = (value: string) => (value === "hr" ? "HR" : value.charAt(0).toUpperCase() + value.slice(1));
  const { register, handleSubmit } = useForm({ defaultValues: { isActive: true } });
  const availableModules = business?.enabledModules?.length
    ? business.enabledModules
    : ["products", "inventory", "warehouses", "locations", "customers", "vendors", "purchasing", "sales", "hr", "reports"];

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
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Name" {...register("name")} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Employee ID" {...register("employeeId")} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Department" {...register("department")} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Role" {...register("role")} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField select fullWidth label="Assigned Warehouse" {...register("assignedWarehouse")}>
              {(warehouses?.items || []).map((w: any) => (
                <MenuItem key={w._id} value={w._id}>{w.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Login Email (optional)" {...register("loginEmail")} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Login Password (optional)" type="password" {...register("loginPassword")} />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Module Access</Typography>
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
