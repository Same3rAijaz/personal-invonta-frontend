import {
  Box, Button, Chip, Divider, Paper, Stack, Tab, Tabs, Typography, Autocomplete, TextField
} from "@mui/material";
import React from "react";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import PeopleIcon from "@mui/icons-material/People";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import {
  useShopFriends,
  useShopFriendRequests,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useDeclineFriendRequest,
  useRemoveFriend
} from "../../hooks/useShopFriends";
import { useBusinessDirectory } from "../../hooks/useBusinessDirectory";
import { useToast } from "../../hooks/useToast";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import PageHeader from "../../components/PageHeader";

export default function ShopFriends() {
  const [tab, setTab] = React.useState<"friends" | "requests">("friends");
  const [shopSearch, setShopSearch] = React.useState("");
  const [selectedShop, setSelectedShop] = React.useState<any>(null);

  const { data: friends, isLoading: friendsLoading } = useShopFriends();
  const { data: requests, isLoading: requestsLoading } = useShopFriendRequests();
  const { data: directory } = useBusinessDirectory(shopSearch || undefined);
  const sendRequest = useSendFriendRequest();
  const accept = useAcceptFriendRequest();
  const decline = useDeclineFriendRequest();
  const remove = useRemoveFriend();
  const { notify } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();

  const friendList: any[] = friends?.items || friends || [];
  const requestList: any[] = requests?.items || requests || [];
  const incomingRequests = requestList.filter((r: any) => r.status === "PENDING" && !r.isSender);
  const sentRequests = requestList.filter((r: any) => r.status === "PENDING" && r.isSender);

  const handleSendRequest = async () => {
    if (!selectedShop) { notify("Select a shop first", "error"); return; }
    try {
      await sendRequest.mutateAsync(selectedShop._id);
      notify("Friend request sent!", "success");
      setSelectedShop(null);
      setShopSearch("");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed to send request", "error");
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await accept.mutateAsync(id);
      notify("Friend request accepted", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await decline.mutateAsync(id);
      notify("Request declined", "info");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  const handleRemove = async (id: string, name: string) => {
    if (!(await confirm({ title: "Remove Friend", message: `Remove ${name} from your shop friends?`, confirmText: "Remove" }))) return;
    try {
      await remove.mutateAsync(id);
      notify("Friend removed", "info");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <Box>
      <PageHeader title="Shop Friends" />

      {/* ── Incoming requests — always visible at the top ── */}
      {incomingRequests.length > 0 && (
        <Paper
          sx={{
            mb: 3, borderRadius: 3, overflow: "hidden",
            border: "1px solid",
            borderColor: "warning.light",
            boxShadow: "0 4px 24px rgba(245,158,11,0.12)"
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              px: 3, py: 1.5,
              background: "linear-gradient(90deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.04) 100%)",
              borderBottom: "1px solid rgba(245,158,11,0.2)"
            }}
          >
            <NotificationsActiveIcon sx={{ color: "warning.main", fontSize: 20 }} />
            <Typography variant="subtitle2" fontWeight={700} color="warning.dark">
              {incomingRequests.length} Incoming Friend Request{incomingRequests.length > 1 ? "s" : ""}
            </Typography>
          </Stack>
          {incomingRequests.map((req: any, idx: number) => {
            const shop = req.senderBusiness || req.sender || {};
            const shopName = shop.name || `Shop …${String(req.senderBusinessId || "").slice(-6)}`;
            return (
              <Box key={req._id || idx}>
                {idx > 0 && <Divider />}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 2 }}>
                  <Box>
                    <Typography fontWeight={600}>{shopName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {shop.city || ""}
                      {shop.city && shop.businessCategoryPath ? " · " : ""}
                      {shop.businessCategoryPath?.split(" > ").pop() || ""}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<CheckIcon />}
                      onClick={() => handleAccept(req._id)}
                      disabled={accept.isPending}
                    >
                      Accept
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<CloseIcon />}
                      onClick={() => handleDecline(req._id)}
                      disabled={decline.isPending}
                    >
                      Decline
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            );
          })}
        </Paper>
      )}

      {/* ── Add a friend ── */}
      <Paper sx={{ p: 3, borderRadius: 3, mb: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>Add a Shop Friend</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Connect with other shops to borrow or lend stock between each other.
        </Typography>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Autocomplete
            sx={{ flex: 1 }}
            options={directory?.items || []}
            getOptionLabel={(option: any) =>
              `${option.name}${option.city ? ` — ${option.city}` : ""}`
            }
            value={selectedShop}
            onChange={(_, value) => setSelectedShop(value)}
            onInputChange={(_, value) => setShopSearch(value)}
            isOptionEqualToValue={(a: any, b: any) => a._id === b._id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search for a shop"
                placeholder="Type shop name..."
                size="small"
              />
            )}
            noOptionsText="No shops found"
          />
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={handleSendRequest}
            disabled={!selectedShop || sendRequest.isPending}
            sx={{ whiteSpace: "nowrap", height: 40 }}
          >
            Send Request
          </Button>
        </Stack>
      </Paper>

      {/* ── Friends / Sent Requests tabs ── */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab
          label={
            <Stack direction="row" spacing={0.5} alignItems="center">
              <span>Friends</span>
              {friendList.length > 0 && (
                <Chip label={friendList.length} size="small" color="primary" sx={{ height: 18, fontSize: 11 }} />
              )}
            </Stack>
          }
          value="friends"
        />
        <Tab
          label={
            <Stack direction="row" spacing={0.5} alignItems="center">
              <span>Sent Requests</span>
              {sentRequests.length > 0 && (
                <Chip label={sentRequests.length} size="small" color="default" sx={{ height: 18, fontSize: 11 }} />
              )}
            </Stack>
          }
          value="requests"
        />
      </Tabs>

      {tab === "friends" && (
        <Paper sx={{ borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)", overflow: "hidden" }}>
          {friendsLoading ? (
            <Typography sx={{ p: 3 }} color="text.secondary">Loading friends…</Typography>
          ) : friendList.length === 0 ? (
            <Stack alignItems="center" spacing={1} sx={{ py: 6 }}>
              <PeopleIcon sx={{ fontSize: 48, color: "text.disabled" }} />
              <Typography color="text.secondary">No shop friends yet. Send a request above to get started.</Typography>
            </Stack>
          ) : (
            friendList.map((friend: any, idx: number) => {
              const shop = friend.business || friend;
              return (
                <Box key={friend._id || idx}>
                  {idx > 0 && <Divider />}
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 2 }}>
                    <Box>
                      <Typography fontWeight={600}>{shop.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {shop.city || ""}
                        {shop.city && shop.businessCategoryPath ? " · " : ""}
                        {shop.businessCategoryPath?.split(" > ").pop() || ""}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      onClick={() => handleRemove(friend._id, shop.name)}
                    >
                      Remove
                    </Button>
                  </Stack>
                </Box>
              );
            })
          )}
        </Paper>
      )}

      {tab === "requests" && (
        <Paper sx={{ borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)", overflow: "hidden" }}>
          {sentRequests.length === 0 ? (
            <Stack alignItems="center" spacing={1} sx={{ py: 6 }}>
              <Typography color="text.secondary">No sent requests pending.</Typography>
            </Stack>
          ) : (
            sentRequests.map((req: any, idx: number) => {
              const shop = req.receiverBusiness || req.receiver || {};
              return (
                <Box key={req._id || idx}>
                  {idx > 0 && <Divider />}
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 2 }}>
                    <Box>
                      <Typography fontWeight={600}>{shop.name || `Shop …${String(req.targetBusinessId || "").slice(-6)}`}</Typography>
                      <Typography variant="caption" color="text.secondary">Waiting for their response</Typography>
                    </Box>
                    <Chip label="Pending" color="warning" size="small" />
                  </Stack>
                </Box>
              );
            })
          )}
        </Paper>
      )}

      {confirmDialog}
    </Box>
  );
}
