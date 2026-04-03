import React from "react";
import { Box, Paper, Stack, Typography, useTheme, SvgIconProps } from "@mui/material";

export interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType<SvgIconProps>;
  color: "primary" | "secondary" | "success" | "error" | "warning" | "info";
}

export function SummaryCard({ title, value, icon: Icon, color }: SummaryCardProps) {
  const theme = useTheme();
  const themeColor = theme.palette[color].main;
  const lightColor = `${themeColor}18`;

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2, md: 2.5 },
        borderRadius: 2.5,
        border: "1px solid",
        borderColor: "divider",
        transition: "all 0.25s ease",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: { xs: 1, sm: 1.5 },
        overflow: "hidden",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: `0 16px 32px -8px ${themeColor}40`,
          borderColor: `${themeColor}60`,
        },
      }}
    >
      {/* Top row: icon only — title below */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={0.5}>
        <Typography
          color="text.secondary"
          fontWeight={700}
          sx={{
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            lineHeight: 1.3,
            flex: 1,
            fontSize: { xs: "0.6rem", sm: "0.65rem", md: "0.68rem" },
            // Allow title to wrap naturally without overflow
            wordBreak: "break-word",
            overflowWrap: "anywhere",
          }}
        >
          {title}
        </Typography>
        <Box
          sx={{
            backgroundColor: lightColor,
            color: themeColor,
            borderRadius: 1.5,
            width: { xs: 32, sm: 36, md: 40 },
            height: { xs: 32, sm: 36, md: 40 },
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon sx={{ fontSize: { xs: 16, sm: 18, md: 20 } }} />
        </Box>
      </Stack>

      {/* Value — responsive, no overflow */}
      <Typography
        fontWeight={800}
        color="text.primary"
        sx={{
          // Use clamp for fluid scaling: min 1rem, preferred 4vw, max 1.7rem
          fontSize: { xs: "1.1rem", sm: "1.3rem", md: "1.55rem" },
          lineHeight: 1.15,
          // Prevent the number from ever breaking the card boundary
          wordBreak: "break-all",
          overflowWrap: "anywhere",
          minWidth: 0,
        }}
      >
        {value}
      </Typography>
    </Paper>
  );
}
