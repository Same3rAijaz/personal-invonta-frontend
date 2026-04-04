import React from "react";
import { Autocomplete, Box, Button, CircularProgress, Divider, Grid, Paper, Typography } from "@mui/material";
import TextField from "../../components/CustomTextField";;
import { Controller, useForm } from "react-hook-form";
import { useCheckIn, useCheckOut } from "../../hooks/useAttendance";
import { useToast } from "../../hooks/useToast";
import { api } from "../../api/client";
import { useNavigate } from "react-router-dom";
import { useEmployees } from "../../hooks/useEmployees";

export default function AttendanceCreate() {
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [employeeSearch, setEmployeeSearch] = React.useState("");
  const [debouncedEmployeeSearch, setDebouncedEmployeeSearch] = React.useState("");
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

  const { register, control, handleSubmit, watch } = useForm({ defaultValues: { employeeId: "", exportMonth: "" } });
  const exportMonth = watch("exportMonth");

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

  const onExport = async () => {
    if (!exportMonth) {
      notify("Select a month to export", "warning");
      return;
    }
    const { data } = await api.get(`/attendance/export`, { params: { month: exportMonth } });
    const blob = new Blob([data], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${exportMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Attendance Entry</Typography>
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Controller
              name="employeeId"
              control={control}
              rules={{ required: "Employee is required" }}
              render={({ field, fieldState }) => (
                <Autocomplete
                  fullWidth
                  options={employeeOptions}
                  loading={isEmployeesFetching}
                  value={employeeOptions.find((employee: any) => employee.employeeId === field.value) || null}
                  onChange={(_event, option: any | null) => {
                    field.onChange(option?.employeeId || "");
                  }}
                  onInputChange={(_event, value, reason) => {
                    if (reason === "input" || reason === "clear") {
                      setEmployeeSearch(value);
                    }
                  }}
                  isOptionEqualToValue={(option: any, value: any) => option.employeeId === value.employeeId}
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
          </Grid>
          <Grid item xs={6} md={3}>
            <Button variant="contained" fullWidth sx={{ py: 1.4 }} onClick={handleSubmit(onCheckIn)}>
              Check In
            </Button>
          </Grid>
          <Grid item xs={6} md={3}>
            <Button variant="outlined" fullWidth sx={{ py: 1.4 }} onClick={handleSubmit(onCheckOut)}>
              Check Out
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              type="month"
              label="Export Month"
              InputLabelProps={{ shrink: true }}
              {...register("exportMonth")}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button variant="contained" fullWidth sx={{ py: 1.4 }} onClick={onExport}>
              Export CSV
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
