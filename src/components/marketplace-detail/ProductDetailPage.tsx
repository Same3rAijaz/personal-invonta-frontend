import React from "react";
import { Box, Button, Container, Divider, Grid, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { alpha, useTheme } from "@mui/material/styles";
import MarketplaceHeader from "./MarketplaceHeader";
import Breadcrumbs from "./Breadcrumbs";
import ProductImageGallery from "./ProductImageGallery";
import ProductSummary from "./ProductSummary";
import ProductDetailsGrid from "./ProductDetailsGrid";
import ProductDescription from "./ProductDescription";
import SellerContactCard from "./SellerContactCard";
import RelatedProductsGrid from "./RelatedProductsGrid";
import SafetyTipsSection from "./SafetyTipsSection";
import AppDownloadCTA from "./AppDownloadCTA";
import type { ProductDetailViewModel } from "./types";

type MarketOption = { _id: string; name: string };

type ProductDetailPageProps = {
  model: ProductDetailViewModel;
  markets: MarketOption[];
  selectedMarketId: string;
  searchValue: string;
  onMarketChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onBack: () => void;
  onOpenSellerProfile: () => void;
  onOpenRelatedProduct: (id: string) => void;
};

export default function ProductDetailPage(props: ProductDetailPageProps) {
  const {
    model,
    markets,
    selectedMarketId,
    searchValue,
    onMarketChange,
    onSearchChange,
    onSearchSubmit,
    onBack,
    onOpenSellerProfile,
    onOpenRelatedProduct
  } = props;
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: theme.palette.background.default }}>
      <MarketplaceHeader
        markets={markets}
        selectedMarketId={selectedMarketId}
        onMarketChange={onMarketChange}
        search={searchValue}
        onSearchChange={onSearchChange}
        onSearchSubmit={onSearchSubmit}
      />

      <Box sx={{ borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`, bgcolor: theme.palette.background.paper }}>
        <Container maxWidth="lg" sx={{ py: 1 }}>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            {model.categoryLinks.map((item) => (
              <Button key={item.label} href={item.href || "#"} sx={{ minWidth: 0, p: 0, color: theme.palette.text.secondary }}>
                {item.label}
              </Button>
            ))}
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
        <Breadcrumbs items={model.breadcrumbs} />

        <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ color: theme.palette.text.primary, mb: 1.2 }}>
          Back to Marketplace
        </Button>

        <Grid container spacing={{ xs: 2, md: 3 }} alignItems="flex-start">
          <Grid item xs={12} md={8.4}>
            <ProductImageGallery images={model.gallery} featured={model.isFeatured} />

            <Box sx={{ mt: 2 }}>
              <ProductSummary
                price={model.price}
                title={model.title}
                locationText={model.locationText}
                postedText={model.postedText}
              />
            </Box>

            <ProductDetailsGrid items={model.details} />
            <ProductDescription text={model.description} />
          </Grid>

          <Grid item xs={12} md={3.6}>
            <Box sx={{ position: { md: "sticky" }, top: { md: 16 } }}>
              <SellerContactCard seller={model.seller} onOpenProfile={onOpenSellerProfile} />
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <RelatedProductsGrid products={model.relatedProducts} onProductClick={onOpenRelatedProduct} />

        <Box sx={{ mt: 3 }}>
          <SafetyTipsSection tips={model.safetyTips} />
        </Box>

        <Box sx={{ mt: 3 }}>
          <AppDownloadCTA />
        </Box>
      </Container>
    </Box>
  );
}

