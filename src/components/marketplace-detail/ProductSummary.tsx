import React from "react";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import IosShareOutlinedIcon from "@mui/icons-material/IosShareOutlined";
import PlaceIcon from "@mui/icons-material/Place";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { alpha, useTheme } from "@mui/material/styles";

type ProductSummaryProps = {
  price: number;
  title: string;
  locationText: string;
  postedText: string;
};

export default function ProductSummary(props: ProductSummaryProps) {
  const { price, title, locationText, postedText } = props;
  const theme = useTheme();

  return (
    <Box sx={{ mt: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography sx={{ fontSize: { xs: 40, md: 52 }, lineHeight: 1, fontWeight: 800, color: theme.palette.text.primary }}>
            Rs {Number(price || 0).toLocaleString()}
          </Typography>
          <Typography sx={{ mt: 0.8, fontSize: { xs: 28, md: 36 }, lineHeight: 1.15, fontWeight: 700, color: theme.palette.text.primary }}>
            {title}
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" sx={{ color: alpha(theme.palette.text.primary, 0.75) }}>
            <FavoriteBorderIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" sx={{ color: alpha(theme.palette.text.primary, 0.75) }}>
            <IosShareOutlinedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" sx={{ mt: 1.2, gap: 0.8 }}>
        <Stack direction="row" spacing={0.8} alignItems="center">
          <PlaceIcon sx={{ color: theme.palette.secondary.main, fontSize: 17 }} />
          <Typography sx={{ color: theme.palette.text.secondary, fontSize: 14 }}>{locationText}</Typography>
        </Stack>
        <Stack direction="row" spacing={0.8} alignItems="center">
          <AccessTimeIcon sx={{ color: theme.palette.secondary.main, fontSize: 16 }} />
          <Typography sx={{ color: theme.palette.text.secondary, fontSize: 14 }}>{postedText}</Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

