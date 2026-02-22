import React from "react";
import { Box, Chip, IconButton, Paper } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { alpha, useTheme } from "@mui/material/styles";
import type { GalleryImage } from "./types";

type ProductImageGalleryProps = {
  images: GalleryImage[];
  featured?: boolean;
};

export default function ProductImageGallery(props: ProductImageGalleryProps) {
  const { images, featured } = props;
  const theme = useTheme();
  const [index, setIndex] = React.useState(0);
  const total = Math.max(1, images.length);
  const active = images[index] || { id: "fallback", url: "/Invonta.png", alt: "Product image" };

  const prev = () => setIndex((current) => (current - 1 + total) % total);
  const next = () => setIndex((current) => (current + 1) % total);

  return (
    <Paper sx={{ p: 0, overflow: "hidden", borderRadius: 1.2, position: "relative" }}>
      <Box sx={{ position: "relative", bgcolor: "#0b0f1a", minHeight: { xs: 280, md: 460 }, display: "grid", placeItems: "center" }}>
        <Box component="img" src={active.url} alt={active.alt || "Product image"} sx={{ width: "100%", height: { xs: 280, md: 460 }, objectFit: "contain" }} />

        <IconButton
          aria-label="Previous image"
          onClick={prev}
          sx={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", bgcolor: alpha("#fff", 0.88), "&:hover": { bgcolor: "#fff" } }}
        >
          <ChevronLeftIcon />
        </IconButton>
        <IconButton
          aria-label="Next image"
          onClick={next}
          sx={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", bgcolor: alpha("#fff", 0.88), "&:hover": { bgcolor: "#fff" } }}
        >
          <ChevronRightIcon />
        </IconButton>

        {featured ? (
          <Chip label="Featured" size="small" sx={{ position: "absolute", left: 10, bottom: 10, bgcolor: theme.palette.warning.main, color: theme.palette.primary.main, fontWeight: 700 }} />
        ) : null}
        <Chip label={`${index + 1}/${total}`} size="small" sx={{ position: "absolute", right: 10, bottom: 10, bgcolor: alpha("#fff", 0.92), color: theme.palette.text.primary, fontWeight: 700 }} />
      </Box>
    </Paper>
  );
}

