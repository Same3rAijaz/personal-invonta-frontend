import { Box, Button, Card, CardContent, CardActions, Chip, Grid, InputAdornment, Stack, Typography, Avatar, Skeleton } from "@mui/material";
import TextField from "../../components/CustomTextField";;
import SearchIcon from "@mui/icons-material/Search";
import StorefrontIcon from "@mui/icons-material/Storefront";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import React from "react";
import { useShopDiscover, useShopFriends, useShopFriendRequests, useSendFriendRequest } from "../../hooks/useShopFriends";
import { useToast } from "../../hooks/useToast";
import PageHeader from "../../components/PageHeader";

export default function ShopDiscover() {
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data: discoverData, isLoading } = useShopDiscover(debouncedSearch || undefined);
  const { data: friendsData } = useShopFriends();
  const { data: requestsData } = useShopFriendRequests();
  const sendRequest = useSendFriendRequest();
  const { notify } = useToast();

  const friendList: any[] = friendsData?.items || friendsData || [];
  const requestList: any[] = requestsData?.items || requestsData || [];

  const shops: any[] = discoverData?.items || discoverData || [];

  // Build lookup sets for quick status checks
  const friendIds = new Set(
    friendList.map((f: any) => String((f.business || f)?._id || ""))
  );
  const pendingIds = new Set(
    requestList.map((r: any) =>
      String(r.isSender ? r.targetBusinessId : r.senderBusinessId || "")
    )
  );

  const getStatus = (shopId: string): "friend" | "pending" | "none" => {
    if (friendIds.has(shopId)) return "friend";
    if (pendingIds.has(shopId)) return "pending";
    return "none";
  };

  const handleAdd = async (shopId: string, shopName: string) => {
    try {
      await sendRequest.mutateAsync(shopId);
      notify(`Friend request sent to ${shopName}`, "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed to send request", "error");
    }
  };

  const getInitials = (name: string) =>
    String(name || "")
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

  return (
    <Box>
      <PageHeader title="Discover Shops" />

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Find shops to connect with. Once you're friends, you can borrow and lend stock between each other.
      </Typography>

      <TextField
        fullWidth
        placeholder="Search shops by name or city…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          )
        }}
        sx={{ mb: 3 }}
      />

      {isLoading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Skeleton variant="circular" width={48} height={48} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="60%" height={24} />
                  <Skeleton variant="text" width="40%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : shops.length === 0 ? (
        <Stack alignItems="center" spacing={1} sx={{ py: 8 }}>
          <StorefrontIcon sx={{ fontSize: 56, color: "text.disabled" }} />
          <Typography color="text.secondary" variant="h6">
            {debouncedSearch ? "No shops found for your search" : "No shops available"}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Try a different search term
          </Typography>
        </Stack>
      ) : (
        <Grid container spacing={2}>
          {shops.map((shop: any) => {
            const status = getStatus(String(shop._id));
            return (
              <Grid item xs={12} sm={6} md={4} key={String(shop._id)}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: "0 4px 20px rgba(15,23,42,0.08)",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "box-shadow 0.2s",
                    "&:hover": { boxShadow: "0 8px 32px rgba(15,23,42,0.14)" }
                  }}
                >
                  <CardContent sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                      {shop.logoUrl ? (
                        <Avatar src={shop.logoUrl} sx={{ width: 48, height: 48 }} />
                      ) : (
                        <Avatar sx={{ width: 48, height: 48, bgcolor: "primary.main", fontSize: 18, fontWeight: 700 }}>
                          {getInitials(shop.name)}
                        </Avatar>
                      )}
                      <Box sx={{ overflow: "hidden" }}>
                        <Typography fontWeight={700} noWrap>{shop.name}</Typography>
                        {shop.city && (
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {shop.city}{shop.country ? `, ${shop.country}` : ""}
                          </Typography>
                        )}
                      </Box>
                    </Stack>

                    {shop.businessCategoryPath && (
                      <Chip
                        label={shop.businessCategoryPath.split(" > ").pop()}
                        size="small"
                        variant="outlined"
                        sx={{ mb: 1, fontSize: 11 }}
                      />
                    )}

                    {shop.tagline && (
                      <Typography variant="body2" color="text.secondary" sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}>
                        {shop.tagline}
                      </Typography>
                    )}
                  </CardContent>

                  <CardActions sx={{ px: 2, pb: 2 }}>
                    {status === "friend" ? (
                      <Button
                        fullWidth
                        variant="outlined"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        disabled
                        size="small"
                      >
                        Friends
                      </Button>
                    ) : status === "pending" ? (
                      <Button fullWidth variant="outlined" disabled size="small">
                        Request Sent
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<PersonAddIcon />}
                        size="small"
                        onClick={() => handleAdd(String(shop._id), shop.name)}
                        disabled={sendRequest.isPending}
                      >
                        Add Friend
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
