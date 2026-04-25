import React from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import { useToast } from "../../hooks/useToast";

type InviteStatus = "pending" | "used" | "expired";

interface Invite {
  _id: string;
  email: string;
  used: boolean;
  usedAt: string | null;
  expiresAt: string;
  createdAt: string;
}

function getStatus(invite: Invite): InviteStatus {
  if (invite.used) return "used";
  if (new Date(invite.expiresAt) < new Date()) return "expired";
  return "pending";
}

const STATUS_CHIP: Record<InviteStatus, { label: string; color: "success" | "default" | "warning" }> = {
  pending: { label: "Pending", color: "warning" },
  used: { label: "Used", color: "success" },
  expired: { label: "Expired", color: "default" }
};

export default function Invitations() {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [email, setEmail] = React.useState("");
  const [emailError, setEmailError] = React.useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["superadmin-invitations"],
    queryFn: async () => {
      const res = await api.get("/superadmin/requests/invitations?limit=100");
      return res.data.data as { items: Invite[]; total: number };
    }
  });

  const sendMutation = useMutation({
    mutationFn: async (inviteEmail: string) => {
      await api.post("/superadmin/requests/invitations", { email: inviteEmail });
    },
    onSuccess: (_, inviteEmail) => {
      notify(`Invitation sent to ${inviteEmail}`, "success");
      setEmail("");
      setEmailError("");
      queryClient.invalidateQueries({ queryKey: ["superadmin-invitations"] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || "Failed to send invitation";
      notify(msg, "error");
    }
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/superadmin/requests/invitations/${id}`);
    },
    onSuccess: () => {
      notify("Invitation revoked", "success");
      queryClient.invalidateQueries({ queryKey: ["superadmin-invitations"] });
    },
    onError: (err: any) => {
      notify(err?.response?.data?.error?.message || "Failed to revoke invitation", "error");
    }
  });

  const handleSend = () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) {
      setEmailError("Enter a valid email address");
      return;
    }
    setEmailError("");
    sendMutation.mutate(trimmed);
  };

  const handleResend = (inviteEmail: string) => {
    sendMutation.mutate(inviteEmail.toLowerCase().trim());
  };

  const invites: Invite[] = data?.items || [];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: "auto" }}>
      <Typography variant="h5" fontWeight={700} mb={0.5}>
        Business Invitations
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Send an invitation link to a business owner's email. They can use the link to set up their account without waiting for approval.
      </Typography>

      {/* Send invitation form */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} mb={2}>
          Send New Invitation
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "flex-start" }}>
          <TextField
            label="Business owner email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
            error={!!emailError}
            helperText={emailError}
            size="small"
            sx={{ flex: 1, minWidth: 260 }}
            disabled={sendMutation.isPending}
          />
          <Button
            variant="contained"
            startIcon={sendMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
            onClick={handleSend}
            disabled={sendMutation.isPending || !email.trim()}
            sx={{ height: 40, fontWeight: 600, whiteSpace: "nowrap" }}
          >
            {sendMutation.isPending ? "Sending…" : "Send Invitation"}
          </Button>
        </Box>
        <Typography variant="caption" color="text.secondary" mt={1} display="block">
          The invitation link expires in 7 days. Sending to the same email overwrites any existing pending invite.
        </Typography>
      </Paper>

      {/* Invitations table */}
      <Paper sx={{ borderRadius: 2 }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="subtitle1" fontWeight={600}>
            All Invitations {data ? `(${data.total})` : ""}
          </Typography>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={() => queryClient.invalidateQueries({ queryKey: ["superadmin-invitations"] })}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : invites.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography color="text.secondary">No invitations sent yet.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Sent</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Expires</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invites.map((invite) => {
                  const status = getStatus(invite);
                  const chip = STATUS_CHIP[status];
                  const isRevoking = revokeMutation.isPending && revokeMutation.variables === invite._id;
                  const isResending = sendMutation.isPending && sendMutation.variables === invite.email.toLowerCase().trim();
                  return (
                    <TableRow key={invite._id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{invite.email}</TableCell>
                      <TableCell>
                        <Chip label={chip.label} color={chip.color} size="small" />
                      </TableCell>
                      <TableCell sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
                        {new Date(invite.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
                        {status === "used"
                          ? `Used ${invite.usedAt ? new Date(invite.usedAt).toLocaleDateString() : ""}`
                          : new Date(invite.expiresAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
                          {status !== "used" && (
                            <Tooltip title="Resend (resets expiry)">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleResend(invite.email)}
                                  disabled={isResending || sendMutation.isPending}
                                  color="primary"
                                >
                                  {isResending ? <CircularProgress size={14} /> : <RefreshIcon fontSize="small" />}
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                          {status === "pending" && (
                            <Tooltip title="Revoke invitation">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => revokeMutation.mutate(invite._id)}
                                  disabled={isRevoking || revokeMutation.isPending}
                                  color="error"
                                >
                                  {isRevoking ? <CircularProgress size={14} /> : <DeleteOutlineIcon fontSize="small" />}
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}
