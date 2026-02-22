import React from "react";
import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

type SafetyTipsSectionProps = {
  tips: string[];
};

export default function SafetyTipsSection(props: SafetyTipsSectionProps) {
  const { tips } = props;
  const theme = useTheme();

  return (
    <Box sx={{ border: `1px solid ${alpha(theme.palette.text.primary, 0.15)}`, borderRadius: 1, p: { xs: 1.5, md: 2 } }}>
      <Typography sx={{ fontSize: 36, fontWeight: 800, color: theme.palette.text.primary }}>
        Your safety matters to us!
      </Typography>
      <Box component="ul" sx={{ m: 0, mt: 1, pl: 2.5, display: "grid", gap: 0.6 }}>
        {tips.map((tip, index) => (
          <Typography key={index} component="li" sx={{ color: theme.palette.text.secondary, fontSize: 14 }}>
            {tip}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

