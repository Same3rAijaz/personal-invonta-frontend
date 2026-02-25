import { Alert, Box, Button, Paper, Typography, Grid, TextField, MenuItem, Divider, FormControlLabel, Checkbox, Stack } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useEmployees, useUpdateEmployee } from "../../hooks/useEmployees";
import { useWarehouses } from "../../hooks/useWarehouses";
import { useToast } from "../../hooks/useToast";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function EmployeeEdit() {
  const { id } = useParams();
  const { data } = useEmployees({ page: 1, limit: 1000 });
  const { data: warehouses } = useWarehouses({ page: 1, limit: 1000 });
  const updateEmployee = useUpdateEmployee();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { business, user } = useAuth();
  const labelize = (value: string) => (value === "hr" ? "HR" : value.charAt(0).toUpperCase() + value.slice(1));
  const { register, handleSubmit, reset } = useForm({ defaultValues: { isActive: true } });

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
        department: employee.department || "",
        role: employee.role || "",
        assignedWarehouse: employee.assignedWarehouse || "",
        salaryType: employee.salaryType || "MONTHLY",
        monthlyBaseSalary: employee.monthlyBaseSalary || 0,
        dailyRate: employee.dailyRate || 0,
        hourlyRate: employee.hourlyRate || 0,
        overtimeRate: employee.overtimeRate || 0,
        prorateMonthlyByAttendance: employee.prorateMonthlyByAttendance ?? true,
        fixedAllowance: employee.fixedAllowance || 0,
        fixedDeduction: employee.fixedDeduction || 0,
        taxPercent: employee.taxPercent || 0,
        payrollNotes: employee.payrollNotes || "",
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
      payload.monthlyBaseSalary = Number(payload.monthlyBaseSalary || 0);
      payload.dailyRate = Number(payload.dailyRate || 0);
      payload.hourlyRate = Number(payload.hourlyRate || 0);
      payload.overtimeRate = Number(payload.overtimeRate || 0);
      payload.taxPercent = Number(payload.taxPercent || 0);
      payload.fixedAllowance = Number(payload.fixedAllowance || 0);
      payload.fixedDeduction = Number(payload.fixedDeduction || 0);
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
    : ["products", "inventory", "warehouses", "locations", "customers", "vendors", "purchasing", "sales", "hr", "reports"];

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
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Name" disabled={!canEdit} {...register("name")} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Employee ID" disabled={!canEdit} {...register("employeeId")} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Department" disabled={!canEdit} {...register("department")} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Role" disabled={!canEdit} {...register("role")} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField select fullWidth label="Assigned Warehouse" disabled={!canEdit} {...register("assignedWarehouse")}>
              {(warehouses?.items || []).map((w: any) => (
                <MenuItem key={w._id} value={w._id}>{w.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Payroll Settings</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField select fullWidth label="Salary Type" disabled={!canEdit} {...register("salaryType")}>
              <MenuItem value="MONTHLY">Monthly</MenuItem>
              <MenuItem value="DAILY">Daily</MenuItem>
              <MenuItem value="HOURLY">Hourly</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Monthly Base Salary" type="number" disabled={!canEdit} {...register("monthlyBaseSalary")} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Daily Rate" type="number" disabled={!canEdit} {...register("dailyRate")} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Hourly Rate" type="number" disabled={!canEdit} {...register("hourlyRate")} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Overtime Rate / Hour" type="number" disabled={!canEdit} {...register("overtimeRate")} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Tax Percent" type="number" disabled={!canEdit} {...register("taxPercent")} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Fixed Allowance" type="number" disabled={!canEdit} {...register("fixedAllowance")} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Fixed Deduction" type="number" disabled={!canEdit} {...register("fixedDeduction")} />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControlLabel control={<Checkbox disabled={!canEdit} {...register("prorateMonthlyByAttendance")} />} label="Prorate monthly by attendance" />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Payroll Notes" disabled={!canEdit} {...register("payrollNotes")} />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Module Access</Typography>
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
