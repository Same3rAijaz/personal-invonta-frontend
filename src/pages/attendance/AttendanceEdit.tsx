import React from "react";
import { Alert, Box, Button, CircularProgress, Grid, Paper, Stack, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import TextField from "../../components/CustomTextField";
import { useAttendanceEntry, useUpdateAttendance } from "../../hooks/useAttendance";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../hooks/useAuth";

function toDateTimeLocal(value?: string | Date | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function AttendanceEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useToast();
  const updateAttendance = useUpdateAttendance();
  const { data, isLoading } = useAttendanceEntry(id);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>();

  React.useEffect(() => {
    if (!data) return;
    reset({
      checkIn: toDateTimeLocal(data.checkIn),
      checkOut: toDateTimeLocal(data.checkOut),
      breakStart: toDateTimeLocal(data.breakStart),
      breakEnd: toDateTimeLocal(data.breakEnd),
      notes: data.notes || "",
      reason: ""
    });
  }, [data, reset]);

  const onSubmit = async (values: any) => {
    if (!id) return;
    try {
      await updateAttendance.mutateAsync({
        id,
        payload: {
          checkIn: values.checkIn,
          checkOut: values.checkOut,
          breakStart: values.breakStart || undefined,
          breakEnd: values.breakEnd || undefined,
          notes: values.notes || undefined,
          reason: values.reason
        }
      });
      notify("Attendance updated", "success");
      navigate("/attendance");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed to update attendance", "error");
    }
  };

  if (user?.role !== "ADMIN") {
    return (
      <Alert severity="info">
        Attendance editing is available to business admins only.
      </Alert>
    );
  }

  if (isLoading || !data) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const employee = data.employeeId || {};

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Edit Attendance
          </Typography>
          <Typography color="text.secondary">
            {employee.name || "Employee"} {employee.employeeId ? `(${employee.employeeId})` : ""}
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => navigate("/attendance")}>
          Back to Attendance
        </Button>
      </Stack>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Grid container spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              type="datetime-local"
              label="Check In"
              {...register("checkIn", { required: "Check in time is required" })}
              error={!!errors.checkIn}
              helperText={errors.checkIn?.message as string}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              type="datetime-local"
              label="Check Out"
              {...register("checkOut", { required: "Check out time is required" })}
              error={!!errors.checkOut}
              helperText={errors.checkOut?.message as string}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="datetime-local"
              label="Break Start"
              {...register("breakStart")}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="datetime-local"
              label="Break End"
              {...register("breakEnd")}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Notes"
              {...register("notes")}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Reason for Edit"
              {...register("reason", { required: "Edit reason is required" })}
              error={!!errors.reason}
              helperText={errors.reason?.message as string}
            />
          </Grid>
          <Grid item xs={12}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="flex-end">
              <Button variant="text" onClick={() => navigate("/attendance")}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={updateAttendance.isPending}>
                {updateAttendance.isPending ? "Saving..." : "Update Attendance"}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
