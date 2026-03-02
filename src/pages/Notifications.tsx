import { Box, Button, Typography } from "@mui/material";
import React from "react";
import PageHeader from "../components/PageHeader";
import { useNotifications, useMarkNotificationRead } from "../hooks/useNotifications";
import { useToast } from "../hooks/useToast";
import DataTable from "../components/DataTable";

export default function Notifications() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const { data, isLoading } = useNotifications({ page: page + 1, limit: rowsPerPage });
  const markRead = useMarkNotificationRead();
  const { notify } = useToast();

  const onMarkRead = async (id: string) => {
    try {
      await markRead.mutateAsync(id);
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed to update", "error");
    }
  };

  return (
    <Box>
      <PageHeader title="Notifications" />
      <DataTable
        title="Notifications"
        subtitle={data?.total ? `${data.total} records` : "No notifications yet."}
        columns={[
          { key: "title", label: "Title" },
          { key: "message", label: "Message" },
          { key: "type", label: "Type" },
          { key: "status", label: "Status", render: (row: any) => (row.readAt ? "Read" : "Unread") },
          {
            key: "action",
            label: "Action",
            render: (row: any) =>
              row.readAt ? (
                <Typography variant="body2" color="text.secondary">-</Typography>
              ) : (
                <Button size="small" variant="outlined" onClick={() => onMarkRead(row.id || row._id)}>
                  Mark read
                </Button>
              )
          }
        ]}
        rows={data?.items || []}
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
