import React from "react";
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  Stack,
  IconButton,
  alpha,
  Paper,
  Divider,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import StorefrontIcon from "@mui/icons-material/Storefront";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import MarketplaceHeader from "../../components/marketplace-detail/MarketplaceHeader";
import PublicFooter from "../../components/marketplace-detail/PublicFooter";
import { toProductUrl } from "../../utils/seo";
import { useToast } from "../../hooks/useToast";

import { useFavorites } from "../../hooks/useFavorites";

export default function Favorites() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const { favorites, isLoading, toggle } = useFavorites();
  
  const palette = {
    canvas: "#d7dce4",
    surface: "#ffffff",
    ink: "#0b1220",
    muted: "#51607a",
    accent: "#21a6df",
    line: alpha("#0b1220", 0.14)
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: palette.canvas }}>
      <MarketplaceHeader showSearchBar={false} />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
          <IconButton onClick={() => navigate("/marketplace")} sx={{ bgcolor: palette.surface }}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ color: palette.ink, fontWeight: 800 }}>
              My Favorites
            </Typography>
            <Typography variant="body2" sx={{ color: palette.muted }}>
              Manage your saved products
            </Typography>
          </Box>
        </Stack>

        {isLoading ? (
          <Paper sx={{ p: 4, borderRadius: 1.5, textAlign: "center" }}>
            <Typography color="text.secondary">Loading favorites...</Typography>
          </Paper>
        ) : favorites.length === 0 ? (
          <Paper sx={{ p: 8, borderRadius: 1.5, textAlign: "center" }}>
            <FavoriteIcon sx={{ fontSize: 60, color: alpha(palette.ink, 0.1), mb: 2 }} />
            <Typography variant="h6" sx={{ color: palette.ink, fontWeight: 700 }}>
              No favorites yet
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Heart products you like to save them for later.
            </Typography>
            <Box>
              <Button
                variant="contained"
                onClick={() => navigate("/marketplace")}
                sx={{
                  bgcolor: palette.ink,
                  color: "#fff",
                  fontWeight: 800,
                  px: 4,
                  py: 1.2,
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: 15,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    bgcolor: palette.accent,
                    transform: "scale(1.05)",
                    boxShadow: `0 8px 20px ${alpha(palette.accent, 0.3)}`
                  }
                }}
              >
                Browse Marketplace
              </Button>
            </Box>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {favorites.map((product: any) => {
              const business = product.businessId || {};
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
                  <Card
                    sx={{
                      borderRadius: 2,
                      border: `1px solid ${palette.line}`,
                      overflow: "hidden",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        boxShadow: "0 12px 30px rgba(15,23,42,0.15)",
                        transform: "translateY(-4px)"
                      },
                      position: "relative"
                    }}
                  >
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(product._id);
                      }}
                      sx={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        bgcolor: "rgba(255,255,255,0.8)",
                        color: "#ef4444",
                        "&:hover": { bgcolor: "#fff" },
                        zIndex: 2
                      }}
                    >
                      <FavoriteIcon />
                    </IconButton>

                    <Box
                      component="img"
                      src={product.thumbnailUrl || "/Invonta.png"}
                      sx={{
                        width: "100%",
                        height: 200,
                        objectFit: "cover",
                        cursor: "pointer"
                      }}
                      onClick={() => navigate(toProductUrl(product))}
                    />

                    <Box sx={{ p: 2 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          color: palette.ink,
                          fontWeight: 700,
                          fontSize: 16,
                          mb: 0.5,
                          cursor: "pointer"
                        }}
                        noWrap
                        onClick={() => navigate(toProductUrl(product))}
                      >
                        {product.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: palette.muted, mb: 1.5 }} noWrap>
                        {product.category || "General"}
                      </Typography>

                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography
                          variant="h5"
                          sx={{ color: palette.ink, fontWeight: 800, fontSize: 20 }}
                        >
                          Rs {Number(product.salePrice || 0).toLocaleString()}
                        </Typography>
                      </Stack>

                      <Divider sx={{ my: 1.5 }} />

                      <Stack spacing={1}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <StorefrontIcon sx={{ fontSize: 16, color: palette.accent }} />
                          <Typography variant="body2" sx={{ color: palette.muted, fontWeight: 600 }} noWrap>
                            {business.name || "Unknown Shop"}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <PlaceOutlinedIcon sx={{ fontSize: 16, color: palette.accent }} />
                          <Typography variant="body2" sx={{ color: palette.muted }} noWrap>
                            {business.city || "N/A"}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>
      <PublicFooter />
    </Box>
  );
}
