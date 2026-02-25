import { Box } from "@mui/material";
import React from "react";
import { useAttendance } from "../../hooks/useAttendance";
import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import { useNavigate } from "react-router-dom";

export default function Attendance() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const { data } = useAttendance({ page: page + 1, limit: rowsPerPage });
  const navigate = useNavigate();
  const rows = (data?.items || []).map((item: any) => {
    const employee = item?.employeeId || {};
    const employeeUser = employee?.userId || {};
    return {
      ...item,
      employeeCode: employee?.employeeId || "-",
      employeeName: employee?.name || "-",
      employeeEmail: employeeUser?.email || "-"
    };
  });

  return (
    <Box>
      <PageHeader title="Attendance" actionLabel="New Entry" onAction={() => navigate("/attendance/new")} />
      <DataTable
        columns={[
          { key: "employeeCode", label: "Employee ID" },
          { key: "employeeName", label: "Employee Name" },
          { key: "employeeEmail", label: "Employee Email" },
          { key: "checkIn", label: "Check In" },
          { key: "checkOut", label: "Check Out" },
          { key: "totalHours", label: "Total Hours" },
          { key: "overtimeHours", label: "Overtime" }
        ]}
        rows={rows}
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
