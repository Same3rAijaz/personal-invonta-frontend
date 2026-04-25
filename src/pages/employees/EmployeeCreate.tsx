import { Checkbox, FormControlLabel, Grid, MenuItem, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { IconButton, InputAdornment } from "@mui/material";
import TextField from "../../components/CustomTextField";
import SidebarLayout from "../../components/SidebarLayout";
import { useCreateEmployee } from "../../hooks/useEmployees";
import { useToast } from "../../hooks/useToast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  EMPLOYMENT_TYPE_OPTIONS,
  labelizeModule,
  SALARY_TYPE_OPTIONS,
  SYSTEM_MODULE_OPTIONS,
  humanizeToken
} from "../../constants/hr";

const numberInput = { valueAsNumber: true };

export default function EmployeeCreate({ onSuccess, onCancel }: { onSuccess?: () => void; onCancel?: () => void } = {}) {
  const createEmployee = useCreateEmployee();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { business } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<any>({
    defaultValues: {
      isActive: true,
      employmentType: "FULL_TIME",
      salaryType: "MONTHLY",
      overtimeEligible: true,
      prorateMonthlyByAttendance: true,
      standardHoursPerDay: 8,
      standardWorkDaysPerMonth: 26,
      monthlyBaseSalary: 0,
      dailyRate: 0,
      hourlyRate: 0,
      overtimeRate: 0,
      fixedAllowance: 0,
      fixedDeduction: 0,
      taxPercent: 0
    }
  });
  const loginEmail = watch("loginEmail");
  const salaryType = watch("salaryType");
  const availableModules = business?.enabledModules?.length ? business.enabledModules : [...SYSTEM_MODULE_OPTIONS];

  const onSubmit = async (values: any) => {
    try {
      const allowedModules = Object.keys(values)
        .filter((key) => key.startsWith("module_") && values[key])
        .map((key) => key.replace("module_", ""));
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
      if (onSuccess) onSuccess();
      else navigate("/employees");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <SidebarLayout title="Create Employee" onCancel={onCancel} isSubmitting={createEmployee.isPending} submitLabel="Save Employee">
      <Grid container spacing={2} component="form" id="sidebar-form" onSubmit={handleSubmit(onSubmit)}>
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Profile
          </Typography>
        </Grid>
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
          <TextField fullWidth label="Role / Title" {...register("role")} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField select fullWidth label="Employment Type" {...register("employmentType")}>
            {EMPLOYMENT_TYPE_OPTIONS.map((item) => (
              <MenuItem key={item} value={item}>
                {humanizeToken(item)}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Department" {...register("department")} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Designation" {...register("designation")} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth type="date" label="Joining Date" {...register("joiningDate")} />
        </Grid>

        <Grid item xs={12} sx={{ pt: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Payroll Setup
          </Typography>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField select fullWidth label="Salary Type" {...register("salaryType")}>
            {SALARY_TYPE_OPTIONS.map((item) => (
              <MenuItem key={item} value={item}>
                {humanizeToken(item)}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="number"
            label="Standard Hours / Day"
            {...register("standardHoursPerDay", numberInput)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="number"
            label="Expected Work Days / Month"
            {...register("standardWorkDaysPerMonth", numberInput)}
          />
        </Grid>
        {salaryType === "MONTHLY" ? (
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Monthly Base Salary"
              {...register("monthlyBaseSalary", numberInput)}
            />
          </Grid>
        ) : null}
        {salaryType === "DAILY" ? (
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Daily Rate"
              {...register("dailyRate", numberInput)}
            />
          </Grid>
        ) : null}
        {salaryType === "HOURLY" ? (
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Hourly Rate"
              {...register("hourlyRate", numberInput)}
            />
          </Grid>
        ) : null}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Overtime Hourly Rate"
            {...register("overtimeRate", numberInput)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="number"
            label="Fixed Allowance"
            {...register("fixedAllowance", numberInput)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="number"
            label="Fixed Deduction"
            {...register("fixedDeduction", numberInput)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="number"
            label="Tax Percent"
            {...register("taxPercent", numberInput)}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth multiline minRows={2} label="Payroll Notes" {...register("payrollNotes")} />
        </Grid>
        <Grid item xs={12}>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <FormControlLabel control={<Checkbox defaultChecked {...register("overtimeEligible")} />} label="Eligible for overtime" />
            <FormControlLabel control={<Checkbox defaultChecked {...register("prorateMonthlyByAttendance")} />} label="Prorate monthly salary by attendance" />
          </Stack>
        </Grid>

        <Grid item xs={12} sx={{ pt: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Portal Access
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Login Email (optional)" {...register("loginEmail")} />
        </Grid>
        <Grid item xs={12} md={6}>
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
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            System Access (RBAC)
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            {availableModules.map((moduleName: string) => (
              <FormControlLabel
                key={moduleName}
                control={<Checkbox {...register(`module_${moduleName}`)} />}
                label={labelizeModule(moduleName)}
              />
            ))}
          </Stack>
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel control={<Checkbox defaultChecked {...register("isActive")} />} label="Active employee" />
        </Grid>
      </Grid>
    </SidebarLayout>
  );
}
