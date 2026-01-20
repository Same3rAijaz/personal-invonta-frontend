import { Box, Button, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import PageHeader from "../components/PageHeader";
import { useNotifications, useMarkNotificationRead } from "../hooks/useNotifications";
import { useToast } from "../hooks/useToast";

export default function Notifications() {
  const { data } = useNotifications();
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
      <Paper sx={{ p: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Message</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.items || []).map((item: any) => (
              <TableRow key={item.id || item._id}>
                <TableCell>{item.title}</TableCell>
                <TableCell>{item.message}</TableCell>
                <TableCell>{item.type}</TableCell>
                <TableCell>{item.readAt ? "Read" : "Unread"}</TableCell>
                <TableCell>
                  {item.readAt ? (
                    <Typography variant="body2" color="text.secondary">—</Typography>
                  ) : (
                    <Button size="small" variant="outlined" onClick={() => onMarkRead(item.id || item._id)}>
                      Mark read
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {(data?.items || []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography variant="body2" color="text.secondary">No notifications yet.</Typography>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
