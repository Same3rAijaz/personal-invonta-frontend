import { Alert, Checkbox, FormControlLabel, Grid, MenuItem, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { IconButton, InputAdornment } from "@mui/material";
import TextField from "../../components/CustomTextField";
import SidebarLayout from "../../components/SidebarLayout";
import { useEmployees, useUpdateEmployee } from "../../hooks/useEmployees";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../hooks/useAuth";
import {
  EMPLOYMENT_TYPE_OPTIONS,
  labelizeModule,
  SALARY_TYPE_OPTIONS,
  SYSTEM_MODULE_OPTIONS,
  humanizeToken
} from "../../constants/hr";

const numberInput = { valueAsNumber: true };

function toDateOnly(value?: string | Date | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export default function EmployeeEdit({ explicitId, onSuccess, onCancel }: { explicitId?: string; onSuccess?: () => void; onCancel?: () => void } = {}) {
  const params = useParams();
  const id = explicitId || params.id;
  const { data } = useEmployees({ page: 1, limit: 1000 });
  const updateEmployee = useUpdateEmployee();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { business, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
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

  const employee = (data?.items || []).find((item: any) => item._id === id);
  const salaryType = watch("salaryType");
  const loginEmail = watch("loginEmail");
  const loginPassword = watch("loginPassword");
  const isBusinessAdminEmployee =
    Boolean(employee?.isBusinessAdmin) ||
    String(employee?.role || "").toUpperCase() === "ADMIN" ||
    String(employee?.linkedUserRole || "").toUpperCase() === "ADMIN";
  const canEdit = user?.role === "SUPER_ADMIN" || !isBusinessAdminEmployee;

  useEffect(() => {
    if (!employee) return;
    reset({
      name: employee.name || "",
      employeeId: employee.employeeId || "",
      role: employee.role || "",
      employmentType: employee.employmentType || "FULL_TIME",
      department: employee.department || "",
      designation: employee.designation || "",
      joiningDate: toDateOnly(employee.joiningDate),
      salaryType: employee.salaryType || "MONTHLY",
      monthlyBaseSalary: Number(employee.monthlyBaseSalary || 0),
      dailyRate: Number(employee.dailyRate || 0),
      hourlyRate: Number(employee.hourlyRate || 0),
      overtimeRate: Number(employee.overtimeRate || 0),
      overtimeEligible: employee.overtimeEligible ?? true,
      prorateMonthlyByAttendance: employee.prorateMonthlyByAttendance ?? true,
      standardHoursPerDay: Number(employee.standardHoursPerDay || 8),
      standardWorkDaysPerMonth: Number(employee.standardWorkDaysPerMonth || 26),
      fixedAllowance: Number(employee.fixedAllowance || 0),
      fixedDeduction: Number(employee.fixedDeduction || 0),
      taxPercent: Number(employee.taxPercent || 0),
      payrollNotes: employee.payrollNotes || "",
      isActive: employee.isActive ?? true,
      ...Object.fromEntries((employee.allowedModules || []).map((moduleName: string) => [`module_${moduleName}`, true]))
    });
  }, [employee, reset]);

  const onSubmit = async (values: any) => {
    if (!id) return;
    if (!canEdit) {
      notify("Only super admin can edit business admin employees", "error");
      return;
    }
    try {
      const normalizedLoginEmail = String(values.loginEmail || "").trim();
      const isSendingInvite = !employee.userId && Boolean(normalizedLoginEmail);
      const allowedModules = Object.keys(values)
        .filter((key) => key.startsWith("module_") && values[key])
        .map((key) => key.replace("module_", ""));
      const payload: any = { ...values };
      Object.keys(payload).forEach((key) => {
        if (key.startsWith("module_")) delete payload[key];
      });
      await updateEmployee.mutateAsync({
        id,
        payload: {
          ...payload,
          allowedModules,
          loginEmail: normalizedLoginEmail || undefined,
          loginPassword: values.loginPassword || undefined
        }
      });
      notify(isSendingInvite ? "Employee updated and invite email sent" : "Employee updated", "success");
      if (onSuccess) onSuccess();
      else navigate("/employees");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  if (!employee) {
    return <Typography>Loading...</Typography>;
  }

  const availableModules = business?.enabledModules?.length ? business.enabledModules : [...SYSTEM_MODULE_OPTIONS];

  return (
    <SidebarLayout title="Edit Employee" onCancel={onCancel} isSubmitting={updateEmployee.isPending} submitLabel="Update Employee">
      {!canEdit ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Editing business admin employees is restricted to super admin only.
        </Alert>
      ) : null}
      {employee.userId ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Portal access is already active{employee.linkedUserEmail ? ` for ${employee.linkedUserEmail}` : ""}. Use reset password if the employee needs a new password.
        </Alert>
      ) : (
        <Alert severity="info" sx={{ mb: 2 }}>
          This employee does not have a portal login yet. Add an email below to create access and send an invite email.
        </Alert>
      )}
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
          <TextField fullWidth label="Role / Title" disabled={!canEdit} {...register("role")} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField select fullWidth label="Employment Type" disabled={!canEdit} {...register("employmentType")}>
            {EMPLOYMENT_TYPE_OPTIONS.map((item) => (
              <MenuItem key={item} value={item}>
                {humanizeToken(item)}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Department" disabled={!canEdit} {...register("department")} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Designation" disabled={!canEdit} {...register("designation")} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth type="date" label="Joining Date" disabled={!canEdit} {...register("joiningDate")} />
        </Grid>

        <Grid item xs={12} sx={{ pt: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Payroll Setup
          </Typography>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField select fullWidth label="Salary Type" disabled={!canEdit} {...register("salaryType")}>
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
            disabled={!canEdit}
            {...register("standardHoursPerDay", numberInput)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="number"
            label="Expected Work Days / Month"
            disabled={!canEdit}
            {...register("standardWorkDaysPerMonth", numberInput)}
          />
        </Grid>
        {salaryType === "MONTHLY" ? (
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Monthly Base Salary"
              disabled={!canEdit}
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
              disabled={!canEdit}
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
              disabled={!canEdit}
              {...register("hourlyRate", numberInput)}
            />
          </Grid>
        ) : null}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Overtime Hourly Rate"
            disabled={!canEdit}
            {...register("overtimeRate", numberInput)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="number"
            label="Fixed Allowance"
            disabled={!canEdit}
            {...register("fixedAllowance", numberInput)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="number"
            label="Fixed Deduction"
            disabled={!canEdit}
            {...register("fixedDeduction", numberInput)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="number"
            label="Tax Percent"
            disabled={!canEdit}
            {...register("taxPercent", numberInput)}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth multiline minRows={2} label="Payroll Notes" disabled={!canEdit} {...register("payrollNotes")} />
        </Grid>
        <Grid item xs={12}>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <FormControlLabel control={<Checkbox disabled={!canEdit} {...register("overtimeEligible")} />} label="Eligible for overtime" />
            <FormControlLabel control={<Checkbox disabled={!canEdit} {...register("prorateMonthlyByAttendance")} />} label="Prorate monthly salary by attendance" />
          </Stack>
        </Grid>

        {!employee.userId ? (
          <>
            <Grid item xs={12} sx={{ pt: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Portal Access
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="email"
                label="Login Email"
                disabled={!canEdit}
                {...register("loginEmail", {
                  validate: (value) => {
                    if (!value && !loginPassword) return true;
                    if (!value && loginPassword) return "Login email is required when password is provided";
                    return true;
                  }
                })}
                error={!!errors.loginEmail}
                helperText={(errors.loginEmail?.message as string) || "We will send the employee invite to this email address."}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Login Password"
                type={showPassword ? "text" : "password"}
                disabled={!canEdit}
                {...register("loginPassword", {
                  validate: (value) => {
                    if (!loginEmail && !value) return true;
                    if (loginEmail && !String(value || "").trim()) return true;
                    if (value && String(value).length < 6) return "Password must be at least 6 characters";
                    return true;
                  }
                })}
                error={!!errors.loginPassword}
                helperText={
                  (errors.loginPassword?.message as string) ||
                  "Leave blank to auto-generate a temporary password and email the invite."
                }
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
          </>
        ) : null}

        <Grid item xs={12} sx={{ pt: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            System Access (RBAC)
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            {availableModules.map((moduleName: string) => (
              <FormControlLabel
                key={moduleName}
                control={<Checkbox disabled={!canEdit} {...register(`module_${moduleName}`)} />}
                label={labelizeModule(moduleName)}
              />
            ))}
          </Stack>
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel control={<Checkbox disabled={!canEdit} {...register("isActive")} />} label="Active employee" />
        </Grid>
      </Grid>
    </SidebarLayout>
  );
}
