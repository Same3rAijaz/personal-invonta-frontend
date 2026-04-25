import { Box } from "@mui/material";
import TextField from "../../components/CustomTextField";
import React from "react";
import { useAttendance } from "../../hooks/useAttendance";
import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import { useNavigate } from "react-router-dom";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import RowActionMenu from "../../components/RowActionMenu";
import { useAuth } from "../../hooks/useAuth";
import { useEmployees } from "../../hooks/useEmployees";
import { humanizeToken } from "../../constants/hr";

export default function Attendance() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebouncedValue(search.trim());
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "ADMIN";
  const { data: employeeData, isLoading: employeesLoading } = useEmployees({ page: 1, limit: 1000 });
  const selfEmployee = React.useMemo(
    () => (employeeData?.items || []).find((item: any) => String(item.userId || "") === String(user?._id || "")),
    [employeeData?.items, user?._id]
  );
  const { data, isLoading } = useAttendance({
    page: page + 1,
    limit: rowsPerPage,
    search: debouncedSearch || undefined,
    employeeId: !isAdmin ? selfEmployee?._id : undefined,
    enabled: isAdmin || Boolean(selfEmployee?._id)
  });
  const rows = (data?.items || []).map((item: any) => {
    const employee = item?.employeeId || {};
    const employeeUser = employee?.userId || {};
    return {
      ...item,
      employeeCode: employee?.employeeId || "-",
      employeeName: employee?.name || "-",
      employeeEmail: employeeUser?.email || "-",
      sourceLabel: humanizeToken(item?.source || "quick")
    };
  });

  React.useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  const columns: any[] = [
    { key: "employeeCode", label: "Employee ID" },
    { key: "employeeName", label: "Employee Name" },
    { key: "employeeEmail", label: "Employee Email" },
    { key: "sourceLabel", label: "Source" },
    { key: "checkIn", label: "Check In" },
    { key: "checkOut", label: "Check Out" },
    { key: "totalHours", label: "Total Hours" },
    { key: "overtimeHours", label: "Overtime" }
  ];

  if (isAdmin) {
    columns.push({
      key: "actions",
      label: "Actions",
      render: (row: any) => (
        <RowActionMenu
          actions={[
            {
              label: "Edit",
              onClick: () => navigate(`/attendance/${row._id}/edit`)
            }
          ]}
        />
      )
    });
  }

  return (
    <Box>
      <PageHeader
        title={isAdmin ? "Attendance" : "My Attendance"}
        subtitle={isAdmin ? "Track attendance logs, overtime, and corrections." : "Review your own attendance history and clock events."}
        actionLabel="New Entry"
        onAction={() => navigate("/attendance/new")}
      />
      <DataTable
        columns={columns}
        rows={rows}
        loading={isLoading || (!isAdmin && employeesLoading && !selfEmployee)}
        actions={
          <TextField
            size="small"
            placeholder="Search attendance"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{ minWidth: 240 }}
          />
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
    </Box>
  );
}
