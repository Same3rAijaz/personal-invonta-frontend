import React from "react";
import { Box, Grid, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { DetailItem } from "./types";

type ProductDetailsGridProps = {
  items: DetailItem[];
};

export default function ProductDetailsGrid(props: ProductDetailsGridProps) {
  const { items } = props;
  const theme = useTheme();

  return (
    <Box sx={{ mt: 2.2 }}>
      <Typography sx={{ fontSize: 36, fontWeight: 800, color: theme.palette.text.primary }}>
        Details
      </Typography>
      <Grid container spacing={1} sx={{ mt: 0.6 }}>
        {items.map((item) => (
          <Grid key={item.label} item xs={12} sm={6}>
            <Box sx={{ border: `1px solid ${alpha(theme.palette.text.primary, 0.16)}`, borderRadius: 0.8, px: 1.2, py: 0.9, bgcolor: alpha(theme.palette.background.paper, 0.6) }}>
              <Typography sx={{ fontSize: 13, color: theme.palette.text.secondary }}>{item.label}</Typography>
              <Typography sx={{ mt: 0.2, fontSize: 23, fontWeight: 700, color: theme.palette.text.primary }}>{item.value}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

