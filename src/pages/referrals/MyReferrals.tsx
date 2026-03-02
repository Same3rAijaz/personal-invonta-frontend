import { Box, Typography, Paper } from "@mui/material";
import React from "react";
import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import { useMyReferrals } from "../../hooks/useReferrals";
import { useAuth } from "../../hooks/useAuth";

export default function MyReferrals() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const { data, isLoading } = useMyReferrals({ page: page + 1, limit: rowsPerPage });
  const { user } = useAuth();

  return (
    <Box>
      <PageHeader title="My Referrals" />
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Your Referral Code: {user?.referralCode || "-"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Share this code so new users can link to your account.
        </Typography>
      </Paper>
      <DataTable
        columns={[
          { key: "email", label: "Email" },
          { key: "isActive", label: "Active" },
          { key: "createdAt", label: "Signed Up" }
        ]}
        rows={(data?.items || []).map((row: any) => ({
          ...row,
          isActive: row.isActive ? "Yes" : "No",
          createdAt: row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"
        }))}
        loading={isLoading}
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
