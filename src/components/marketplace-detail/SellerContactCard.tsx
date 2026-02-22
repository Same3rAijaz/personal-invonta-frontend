import React from "react";
import { Avatar, Box, Button, Divider, Grid, Paper, Stack, Typography } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import { alpha, useTheme } from "@mui/material/styles";
import type { SellerInfo } from "./types";

type SellerContactCardProps = {
  seller: SellerInfo;
  onOpenProfile?: () => void;
};

function toChatLink(phone?: string) {
  if (!phone) return "#";
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "#";
  return `https://wa.me/${digits}`;
}

export default function SellerContactCard(props: SellerContactCardProps) {
  const { seller, onOpenProfile } = props;
  const theme = useTheme();
  const [showPhone, setShowPhone] = React.useState(false);

  return (
    <Paper sx={{ borderRadius: 1.2, p: 1.5 }}>
      <Stack direction="row" spacing={1.1} alignItems="center">
        <Avatar src={seller.avatarUrl} sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.2), color: theme.palette.primary.main }}>
          {seller.name?.slice(0, 1) || "S"}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>Posted by</Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 800, color: theme.palette.text.primary, lineHeight: 1.05 }}>
            {seller.name}
          </Typography>
        </Box>
        {onOpenProfile ? (
          <Button onClick={onOpenProfile} sx={{ minWidth: 0, p: 0.5 }}>
            <ChevronRightIcon sx={{ color: theme.palette.text.secondary }} />
          </Button>
        ) : null}
      </Stack>

      <Divider sx={{ my: 1.2 }} />

      {(seller.memberSince || seller.activeAds !== undefined) ? (
        <Grid container spacing={1} sx={{ mb: 1.2 }}>
          <Grid item xs={6}>
            <Stack direction="row" spacing={0.8} alignItems="center" sx={{ p: 0.8, border: `1px solid ${alpha(theme.palette.text.primary, 0.14)}`, borderRadius: 0.8 }}>
              <BadgeOutlinedIcon sx={{ fontSize: 16, color: theme.palette.secondary.main }} />
              <Box>
                <Typography sx={{ fontSize: 11, color: theme.palette.text.secondary }}>Member Since</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: theme.palette.text.primary }}>{seller.memberSince || "-"}</Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={6}>
            <Stack direction="row" spacing={0.8} alignItems="center" sx={{ p: 0.8, border: `1px solid ${alpha(theme.palette.text.primary, 0.14)}`, borderRadius: 0.8 }}>
              <ViewListOutlinedIcon sx={{ fontSize: 16, color: theme.palette.secondary.main }} />
              <Box>
                <Typography sx={{ fontSize: 11, color: theme.palette.text.secondary }}>Active Ads</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: theme.palette.text.primary }}>{seller.activeAds ?? "-"}</Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      ) : null}

      <Button
        fullWidth
        variant="contained"
        onClick={() => setShowPhone((value) => !value)}
        sx={{ py: 1.15 }}
      >
        {showPhone ? seller.phone || "Phone not available" : "Show phone number"}
      </Button>
      <Button
        fullWidth
        variant="outlined"
        href={toChatLink(seller.phone)}
        target="_blank"
        rel="noreferrer"
        sx={{ py: 1.15, mt: 1 }}
      >
        Chat
      </Button>

      {(seller.adId || onOpenProfile) ? (
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.1, pt: 1.1, borderTop: `1px solid ${alpha(theme.palette.text.primary, 0.12)}` }}>
          <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>
            {seller.adId ? `Ad ID: ${seller.adId}` : ""}
          </Typography>
          {onOpenProfile ? (
            <Button onClick={onOpenProfile} sx={{ minWidth: 0, p: 0, fontSize: 12 }}>
              Report this ad
            </Button>
          ) : null}
        </Stack>
      ) : null}
    </Paper>
  );
}

