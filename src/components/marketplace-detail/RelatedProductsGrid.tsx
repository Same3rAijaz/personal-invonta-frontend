import React from "react";
import { Box, Card, Grid, IconButton, Typography } from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { alpha, useTheme } from "@mui/material/styles";
import type { RelatedProduct } from "./types";

type RelatedProductsGridProps = {
  products: RelatedProduct[];
  onProductClick: (id: string) => void;
};

export default function RelatedProductsGrid(props: RelatedProductsGridProps) {
  const { products, onProductClick } = props;
  const theme = useTheme();

  return (
    <Box>
      <Typography sx={{ fontSize: 38, fontWeight: 800, color: theme.palette.text.primary, mb: 1.1 }}>
        Related ads
      </Typography>
      {products.length === 0 ? (
        <Typography sx={{ color: theme.palette.text.secondary }}>No related products found.</Typography>
      ) : (
        <Grid container spacing={1.2}>
          {products.map((item) => (
            <Grid key={item.id} item xs={12} sm={6} md={4}>
              <Card
                sx={{ borderRadius: 1, border: `1px solid ${alpha(theme.palette.text.primary, 0.16)}`, cursor: "pointer", height: "100%" }}
                onClick={() => onProductClick(item.id)}
              >
                <Box component="img" src={item.imageUrl || "/Invonta.png"} alt={item.title} sx={{ width: "100%", height: 150, objectFit: "cover" }} />
                <Box sx={{ p: 1.1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                    <Typography sx={{ fontSize: 22, fontWeight: 800, color: theme.palette.text.primary }}>
                      Rs {Number(item.price || 0).toLocaleString()}
                    </Typography>
                    <IconButton size="small" onClick={(event) => event.stopPropagation()}>
                      <FavoriteBorderIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography sx={{ mt: 0.4, fontSize: 21, fontWeight: 600, color: theme.palette.text.primary, lineHeight: 1.2 }}>
                    {item.title}
                  </Typography>
                  <Typography sx={{ mt: 0.5, color: theme.palette.text.secondary, fontSize: 12.5 }}>
                    {item.location || "Location not available"}
                  </Typography>
                  <Typography sx={{ mt: 0.2, color: theme.palette.text.secondary, fontSize: 12 }}>
                    {item.timeAgo || "Recently posted"}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

