import React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

export default function AppDownloadCTA() {
  const theme = useTheme();

  return (
    <Box sx={{ borderRadius: 1, border: `1px solid ${alpha(theme.palette.text.primary, 0.14)}`, bgcolor: alpha(theme.palette.secondary.main, 0.08), p: { xs: 2, md: 3 } }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={2}>
        <Box>
          <Typography sx={{ fontSize: 34, fontWeight: 800, color: theme.palette.text.primary }}>
            Find amazing deals on the go.
          </Typography>
          <Typography sx={{ mt: 0.6, fontSize: 24, fontWeight: 700, color: theme.palette.secondary.main }}>
            Download app now!
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button variant="contained" color="primary">App Store</Button>
          <Button variant="contained" color="primary">Google Play</Button>
          <Button variant="outlined" color="primary">AppGallery</Button>
        </Stack>
      </Stack>
    </Box>
  );
}

