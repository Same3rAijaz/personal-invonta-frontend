import { Box } from "@mui/material";
import { useAttendance } from "../../hooks/useAttendance";
import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import { useNavigate } from "react-router-dom";

export default function Attendance() {
  const { data } = useAttendance();
  const navigate = useNavigate();

  return (
    <Box>
      <PageHeader title="Attendance" actionLabel="New Entry" onAction={() => navigate("/attendance/new")} />
      <DataTable
        columns={[
          { key: "employeeId", label: "Employee ID" },
          { key: "checkIn", label: "Check In" },
          { key: "checkOut", label: "Check Out" },
          { key: "totalHours", label: "Total Hours" },
          { key: "overtimeHours", label: "Overtime" }
        ]}
        rows={data?.items || []}
      />
    </Box>
  );
}