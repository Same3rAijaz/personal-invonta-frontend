import React from "react";
import { Box, Link as MuiLink, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { BreadcrumbItem } from "./types";

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export default function Breadcrumbs(props: BreadcrumbsProps) {
  const { items } = props;
  const theme = useTheme();

  return (
    <Stack direction="row" spacing={0.8} sx={{ py: 1.5, flexWrap: "wrap" }}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={`${item.label}-${index}`}>
            {isLast ? (
              <Typography sx={{ fontSize: 13, color: theme.palette.text.primary, fontWeight: 600 }}>
                {item.label}
              </Typography>
            ) : (
              <MuiLink
                href={item.href || "#"}
                underline="hover"
                sx={{ fontSize: 13, color: alpha(theme.palette.text.secondary, 0.95) }}
              >
                {item.label}
              </MuiLink>
            )}
            {!isLast ? <Box component="span" sx={{ color: alpha(theme.palette.text.secondary, 0.7), fontSize: 13 }}>{">"}</Box> : null}
          </React.Fragment>
        );
      })}
    </Stack>
  );
}

