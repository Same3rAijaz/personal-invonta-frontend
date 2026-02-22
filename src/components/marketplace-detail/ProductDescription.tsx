import React from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

type ProductDescriptionProps = {
  text: string;
};

export default function ProductDescription(props: ProductDescriptionProps) {
  const { text } = props;
  const theme = useTheme();

  return (
    <Box sx={{ mt: 2.2 }}>
      <Typography sx={{ fontSize: 36, fontWeight: 800, color: theme.palette.text.primary }}>
        Description
      </Typography>
      <Typography sx={{ mt: 0.8, fontSize: 16, lineHeight: 1.6, color: theme.palette.text.secondary, whiteSpace: "pre-line" }}>
        {text}
      </Typography>
    </Box>
  );
}

