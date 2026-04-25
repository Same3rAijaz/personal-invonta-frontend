import React from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import TextField from "../../components/CustomTextField";
import { useCheckIn, useCheckOut, useCreateManualAttendance } from "../../hooks/useAttendance";
import { useToast } from "../../hooks/useToast";
import { api } from "../../api/client";
import { useNavigate } from "react-router-dom";
import { useEmployees } from "../../hooks/useEmployees";
import { useAuth } from "../../hooks/useAuth";

function nowLocalDateTime(offsetHours = 0) {
  const date = new Date(Date.now() + offsetHours * 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function AttendanceCreate() {
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const createManualAttendance = useCreateManualAttendance();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [employeeSearch, setEmployeeSearch] = React.useState("");
  const [debouncedEmployeeSearch, setDebouncedEmployeeSearch] = React.useState("");
  const { data: selfEmployeeData } = useEmployees({ page: 1, limit: 1000 });
  const selfEmployee = React.useMemo(
    () => (selfEmployeeData?.items || []).find((item: any) => String(item.userId || "") === String(user?._id || "")),
    [selfEmployeeData?.items, user?._id]
  );
  const { data: employeeData, isFetching: isEmployeesFetching } = useEmployees({
    page: 1,
    limit: 50,
    search: debouncedEmployeeSearch || undefined
  });
  const employeeOptions = employeeData?.items || [];

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedEmployeeSearch(employeeSearch.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [employeeSearch]);

  const { register, control, handleSubmit, watch, setValue } = useForm<any>({
    defaultValues: {
      employeeId: "",
      manualCheckIn: nowLocalDateTime(-8),
      manualCheckOut: nowLocalDateTime(),
      breakStart: "",
      breakEnd: "",
      notes: "",
      exportMonth: new Date().toISOString().slice(0, 7)
    }
  });
  const exportMonth = watch("exportMonth");

  React.useEffect(() => {
    if (!isAdmin && selfEmployee?._id) {
      setValue("employeeId", selfEmployee._id);
    }
  }, [isAdmin, selfEmployee?._id, setValue]);

  const onCheckIn = async (values: any) => {
    try {
      await checkIn.mutateAsync({ employeeId: values.employeeId });
      notify("Checked in", "success");
      navigate("/attendance");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  const onCheckOut = async (values: any) => {
    try {
      await checkOut.mutateAsync({ employeeId: values.employeeId });
      notify("Checked out", "success");
      navigate("/attendance");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  const onCreateManual = async (values: any) => {
    try {
      await createManualAttendance.mutateAsync({
        employeeId: values.employeeId,
        checkIn: values.manualCheckIn,
        checkOut: values.manualCheckOut,
        breakStart: values.breakStart || undefined,
        breakEnd: values.breakEnd || undefined,
        notes: values.notes || undefined
      });
      notify("Manual attendance saved", "success");
      navigate("/attendance");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed to save manual attendance", "error");
    }
  };

  const onExport = async () => {
    if (!exportMonth) {
      notify("Select a month to export", "warning");
      return;
    }
    try {
      const response = await api.get(`/attendance/export`, { params: { month: exportMonth } });
      const csv = response?.data?.data || response?.data || "";
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `attendance-${exportMonth}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed to export attendance", "error");
    }
  };

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Attendance Entry
          </Typography>
          <Typography color="text.secondary">
            Use quick clock actions or create a manual correction entry.
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => navigate("/attendance")}>
          Back to Attendance
        </Button>
      </Stack>

      {!isAdmin && !selfEmployee ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Your user account is not linked to an employee profile yet, so clock actions are unavailable.
        </Alert>
      ) : null}

      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            {isAdmin ? (
              <Controller
                name="employeeId"
                control={control}
                rules={{ required: "Employee is required" }}
                render={({ field, fieldState }) => (
                  <Autocomplete
                    fullWidth
                    options={employeeOptions}
                    loading={isEmployeesFetching}
                    value={employeeOptions.find((employee: any) => employee._id === field.value) || null}
                    onChange={(_event, option: any | null) => {
                      field.onChange(option?._id || "");
                    }}
                    onInputChange={(_event, value, reason) => {
                      if (reason === "input" || reason === "clear") {
                        setEmployeeSearch(value);
                      }
                    }}
                    isOptionEqualToValue={(option: any, value: any) => option._id === value._id}
                    getOptionLabel={(option: any) => {
                      const name = option?.name || "Employee";
                      const id = option?.employeeId || "";
                      return id ? `${name} (${id})` : name;
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Employee"
                        placeholder="Search by employee name or ID"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {isEmployeesFetching ? <CircularProgress color="inherit" size={18} sx={{ mr: 1 }} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                  />
                )}
              />
            ) : (
              <TextField
                fullWidth
                label="Employee"
                value={selfEmployee ? `${selfEmployee.name} (${selfEmployee.employeeId})` : ""}
                InputProps={{ readOnly: true }}
              />
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <Button variant="contained" fullWidth sx={{ py: 1.4 }} disabled={!watch("employeeId") || checkIn.isPending} onClick={handleSubmit(onCheckIn)}>
              Check In
            </Button>
          </Grid>
          <Grid item xs={12} md={6}>
            <Button variant="outlined" fullWidth sx={{ py: 1.4 }} disabled={!watch("employeeId") || checkOut.isPending} onClick={handleSubmit(onCheckOut)}>
              Check Out
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Manual Entry / Correction
            </Typography>
          </Grid>
          {!isAdmin ? (
            <Grid item xs={12}>
              <Alert severity="info">
                Manual entries are restricted to business admins.
              </Alert>
            </Grid>
          ) : null}
          <Grid item xs={12} md={6}>
            <TextField fullWidth type="datetime-local" label="Manual Check In" disabled={!isAdmin} {...register("manualCheckIn")} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth type="datetime-local" label="Manual Check Out" disabled={!isAdmin} {...register("manualCheckOut")} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth type="datetime-local" label="Break Start" disabled={!isAdmin} {...register("breakStart")} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth type="datetime-local" label="Break End" disabled={!isAdmin} {...register("breakEnd")} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth multiline minRows={2} label="Notes" disabled={!isAdmin} {...register("notes")} />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" disabled={!isAdmin || !watch("employeeId") || createManualAttendance.isPending} onClick={handleSubmit(onCreateManual)}>
              Save Manual Attendance
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Export Attendance
            </Typography>
          </Grid>
          <Grid item xs={12} md={8}>
            <TextField fullWidth type="month" label="Export Month" {...register("exportMonth")} />
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: "flex", alignItems: { xs: "stretch", md: "flex-end" } }}>
            <Button variant="contained" fullWidth sx={{ py: 1.4, minHeight: 56 }} onClick={onExport}>
              Export CSV
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
