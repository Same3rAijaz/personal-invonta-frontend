import React from "react";
import {
  Autocomplete,
  Box,
  Checkbox,
  Chip,
  Drawer,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  Typography
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import TextField from "../../components/CustomTextField";
import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import RowActionMenu from "../../components/RowActionMenu";
import SidebarLayout from "../../components/SidebarLayout";
import { useEmployees } from "../../hooks/useEmployees";
import {
  useApproveLeaveRequest,
  useCancelLeaveRequest,
  useCreateLeaveRequest,
  useLeaves,
  useRejectLeaveRequest
} from "../../hooks/useLeaves";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../hooks/useAuth";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import {
  LEAVE_DURATION_OPTIONS,
  LEAVE_STATUS_OPTIONS,
  LEAVE_TYPE_OPTIONS,
  humanizeToken
} from "../../constants/hr";

function formatDateRange(startDate?: string, endDate?: string) {
  const start = startDate ? new Date(startDate).toLocaleDateString() : "-";
  const end = endDate ? new Date(endDate).toLocaleDateString() : "-";
  return start === end ? start : `${start} - ${end}`;
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export default function Leaves() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const { notify } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const debouncedSearch = useDebouncedValue(search.trim());
  const { data: employeesData, isLoading: employeesLoading } = useEmployees({ page: 1, limit: 1000 });
  const employeeOptions = employeesData?.items || [];
  const selfEmployee = React.useMemo(
    () => employeeOptions.find((item: any) => String(item.userId || "") === String(user?._id || "")),
    [employeeOptions, user?._id]
  );
  const leavesQueryEnabled = isAdmin || Boolean(selfEmployee?._id);
  const { data, isLoading } = useLeaves({
    page: page + 1,
    limit: rowsPerPage,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    employeeId: !isAdmin ? selfEmployee?._id : undefined,
    enabled: leavesQueryEnabled
  });
  const createLeave = useCreateLeaveRequest();
  const approveLeave = useApproveLeaveRequest();
  const rejectLeave = useRejectLeaveRequest();
  const cancelLeave = useCancelLeaveRequest();
  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm<any>({
    defaultValues: {
      employeeId: "",
      leaveType: "ANNUAL",
      durationType: "FULL_DAY",
      startDate: todayString(),
      endDate: todayString(),
      isPaid: true,
      reason: "",
      notes: ""
    }
  });
  const leaveType = watch("leaveType");

  React.useEffect(() => {
    setPage(0);
  }, [debouncedSearch, statusFilter]);

  React.useEffect(() => {
    if (leaveType === "UNPAID") {
      setValue("isPaid", false);
    }
  }, [leaveType, setValue]);

  React.useEffect(() => {
    if (!isAdmin && selfEmployee?._id) {
      reset({
        employeeId: selfEmployee._id,
        leaveType: "ANNUAL",
        durationType: "FULL_DAY",
        startDate: todayString(),
        endDate: todayString(),
        isPaid: true,
        reason: "",
        notes: ""
      });
    }
  }, [isAdmin, reset, selfEmployee?._id]);

  const onSubmit = async (values: any) => {
    try {
      await createLeave.mutateAsync({
        employeeId: values.employeeId,
        leaveType: values.leaveType,
        durationType: values.durationType,
        startDate: values.startDate,
        endDate: values.endDate || values.startDate,
        isPaid: Boolean(values.isPaid),
        reason: values.reason,
        notes: values.notes || undefined
      });
      notify("Leave request submitted", "success");
      setDrawerOpen(false);
      reset({
        employeeId: isAdmin ? "" : selfEmployee?._id || "",
        leaveType: "ANNUAL",
        durationType: "FULL_DAY",
        startDate: todayString(),
        endDate: todayString(),
        isPaid: true,
        reason: "",
        notes: ""
      });
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed to submit leave request", "error");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveLeave.mutateAsync({ id, payload: {} });
      notify("Leave approved", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed to approve leave", "error");
    }
  };

  const handleReject = async (id: string) => {
    if (!(await confirm({ title: "Reject Leave Request", message: "Do you want to reject this leave request?", confirmText: "Reject" }))) {
      return;
    }
    try {
      await rejectLeave.mutateAsync({ id, payload: {} });
      notify("Leave rejected", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed to reject leave", "error");
    }
  };

  const handleCancel = async (id: string) => {
    if (!(await confirm({ title: "Cancel Leave Request", message: "Do you want to cancel this leave request?", confirmText: "Cancel Request" }))) {
      return;
    }
    try {
      await cancelLeave.mutateAsync(id);
      notify("Leave request cancelled", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed to cancel leave request", "error");
    }
  };

  const rows = (data?.items || []).map((item: any) => {
    const employee = item.employeeId || {};
    return {
      ...item,
      employeeCode: employee.employeeId || "-",
      employeeName: employee.name || "-",
      designation: employee.designation || "-",
      leaveWindow: formatDateRange(item.startDate, item.endDate),
      leaveTypeLabel: humanizeToken(item.leaveType),
      durationLabel: humanizeToken(item.durationType),
      paidLabel: item.isPaid ? "Paid" : "Unpaid",
      statusLabel: humanizeToken(item.status)
    };
  });

  const pendingCount = rows.filter((item: any) => item.status === "PENDING").length;
  const approvedCount = rows.filter((item: any) => item.status === "APPROVED").length;
  const rejectedCount = rows.filter((item: any) => item.status === "REJECTED").length;

  return (
    <Box>
      <PageHeader
        title="Leaves"
        subtitle={isAdmin ? "Track requests, approvals, and paid/unpaid leave impact." : "Submit and track your leave requests."}
        actionLabel="Request Leave"
        onAction={() => setDrawerOpen(true)}
      />

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        <Chip label={`Pending: ${pendingCount}`} color="warning" variant="outlined" />
        <Chip label={`Approved: ${approvedCount}`} color="success" variant="outlined" />
        <Chip label={`Rejected: ${rejectedCount}`} color="default" variant="outlined" />
      </Stack>

      <DataTable
        title="Leave Requests"
        subtitle={`${data?.total || 0} records`}
        columns={[
          { key: "employeeCode", label: "Employee ID" },
          { key: "employeeName", label: "Employee" },
          { key: "designation", label: "Designation" },
          { key: "leaveTypeLabel", label: "Leave Type" },
          { key: "durationLabel", label: "Duration" },
          { key: "leaveWindow", label: "Dates" },
          { key: "totalDays", label: "Days" },
          { key: "paidLabel", label: "Paid / Unpaid" },
          { key: "statusLabel", label: "Status" },
          {
            key: "actions",
            label: "Actions",
            render: (row: any) => (
              <RowActionMenu
                actions={[
                  {
                    label: "Approve",
                    disabled: !isAdmin || row.status !== "PENDING",
                    onClick: () => handleApprove(row._id)
                  },
                  {
                    label: "Reject",
                    disabled: !isAdmin || row.status !== "PENDING",
                    onClick: () => handleReject(row._id)
                  },
                  {
                    label: "Cancel",
                    disabled: row.status === "CANCELLED" || (!isAdmin && row.status === "APPROVED"),
                    onClick: () => handleCancel(row._id)
                  }
                ]}
              />
            )
          }
        ]}
        rows={rows}
        loading={isLoading || (!isAdmin && employeesLoading && !selfEmployee)}
        actions={
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField
              size="small"
              placeholder="Search leave requests"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ minWidth: 220 }}
            />
            <TextField
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              {LEAVE_STATUS_OPTIONS.map((status) => (
                <MenuItem key={status} value={status}>
                  {humanizeToken(status)}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        }
        page={page}
        rowsPerPage={rowsPerPage}
        total={data?.total || 0}
        onPageChange={setPage}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value);
          setPage(0);
        }}
      />

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{ zIndex: 1300 }}
        PaperProps={{ sx: { width: { xs: "100%", sm: 560 } } }}
      >
        <SidebarLayout
          title="Request Leave"
          onCancel={() => setDrawerOpen(false)}
          isSubmitting={createLeave.isPending}
          submitLabel="Submit Request"
        >
          <Grid container spacing={2} component="form" id="sidebar-form" onSubmit={handleSubmit(onSubmit)}>
            <Grid item xs={12}>
              {isAdmin ? (
                <Controller
                  name="employeeId"
                  control={control}
                  rules={{ required: "Employee is required" }}
                  render={({ field, fieldState }) => (
                    <Autocomplete
                      options={employeeOptions}
                      value={employeeOptions.find((item: any) => item._id === field.value) || null}
                      onChange={(_event, option: any | null) => field.onChange(option?._id || "")}
                      isOptionEqualToValue={(option: any, value: any) => option._id === value._id}
                      getOptionLabel={(option: any) => {
                        const name = option?.name || "Employee";
                        const employeeId = option?.employeeId ? ` (${option.employeeId})` : "";
                        return `${name}${employeeId}`;
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Employee"
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                        />
                      )}
                    />
                  )}
                />
              ) : (
                <TextField
                  fullWidth
                  label="Employee"
                  value={selfEmployee ? `${selfEmployee.name} (${selfEmployee.employeeId})` : "Employee profile not linked"}
                  InputProps={{ readOnly: true }}
                  error={!selfEmployee}
                  helperText={!selfEmployee ? "Your user account is not linked to an employee record yet." : undefined}
                />
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField select fullWidth label="Leave Type" {...register("leaveType", { required: true })}>
                {LEAVE_TYPE_OPTIONS.map((item) => (
                  <MenuItem key={item} value={item}>
                    {humanizeToken(item)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField select fullWidth label="Duration" {...register("durationType", { required: true })}>
                {LEAVE_DURATION_OPTIONS.map((item) => (
                  <MenuItem key={item} value={item}>
                    {humanizeToken(item)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                type="date"
                label="Start Date"
                {...register("startDate", { required: "Start date is required" })}
                error={!!errors.startDate}
                helperText={errors.startDate?.message as string}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                type="date"
                label="End Date"
                {...register("endDate", { required: "End date is required" })}
                error={!!errors.endDate}
                helperText={errors.endDate?.message as string}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Checkbox {...register("isPaid")} disabled={leaveType === "UNPAID"} />}
                label="Count this as paid leave"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                multiline
                minRows={3}
                label="Reason"
                {...register("reason", { required: "Reason is required" })}
                error={!!errors.reason}
                helperText={errors.reason?.message as string}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Notes"
                {...register("notes")}
              />
            </Grid>
          </Grid>
        </SidebarLayout>
      </Drawer>
      {confirmDialog}
    </Box>
  );
}
