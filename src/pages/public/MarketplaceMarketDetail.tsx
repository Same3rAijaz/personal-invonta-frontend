import React from "react";
import { Box, Button, Card, Chip, Container, Divider, Grid, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listPublicMarkets, listPublicProducts, listPublicShops } from "../../api/public";
import MarketplaceHeader from "../../components/marketplace-detail/MarketplaceHeader";
import PublicFooter from "../../components/marketplace-detail/PublicFooter";
import { extractEntityId, toProductUrl, toShopUrl } from "../../utils/seo";


export default function MarketplaceMarketDetail() {
  const params = useParams();
  const marketId = React.useMemo(() => extractEntityId(params.seo || ""), [params.seo]);
  const navigate = useNavigate();
  const [search, setSearch] = React.useState("");
  const [topMarketId, setTopMarketId] = React.useState(marketId);

  const palette = {
    canvas: "#d7dce4",
    ink: "#0b1220",
    muted: "#51607a",
    accent: "#21a6df",
    line: alpha("#0b1220", 0.14)
  };

  React.useEffect(() => {
    setTopMarketId(marketId);
  }, [marketId]);

  const { data: markets = [] } = useQuery({
    queryKey: ["public-markets-market-detail"],
    queryFn: () => listPublicMarkets()
  });

  const market = React.useMemo(
    () => (markets as any[]).find((item: any) => String(item._id) === String(marketId)),
    [markets, marketId]
  );

  const { data: productData } = useQuery({
    queryKey: ["public-market-products-preview", marketId],
    queryFn: () => listPublicProducts({ page: 1, limit: 8, marketId, sort: "newest" }),
    enabled: Boolean(marketId)
  });
  const { data: shopData } = useQuery({
    queryKey: ["public-market-shops-preview", marketId],
    queryFn: () => listPublicShops({ page: 1, limit: 8, marketId, sort: "newest" }),
    enabled: Boolean(marketId)
  });

  const products = productData?.items || [];
  const shops = shopData?.items || [];

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: palette.canvas }}>
      <MarketplaceHeader
        markets={markets}
        selectedMarketId={topMarketId}
        onMarketChange={(value) => setTopMarketId(value)}
        search={search}
        onSearchChange={setSearch}
        onSearchSubmit={() => navigate(`/marketplace?search=${encodeURIComponent(search)}${topMarketId ? `&marketId=${topMarketId}` : ""}`)}
      />

      <Container maxWidth="xl" sx={{ py: 3.5 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/marketplace")} sx={{ color: palette.ink, mb: 1.5 }}>
          Back to Marketplace
        </Button>

        {!market ? (
          <Paper sx={{ p: 3, borderRadius: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: palette.ink }}>
              Market not found
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            <Paper sx={{ p: 2.5, borderRadius: 1, border: `1px solid ${palette.line}` }}>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5}>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: 32, color: palette.ink }}>
                    {market.name}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                    <PlaceOutlinedIcon sx={{ color: palette.accent }} />
                    <Typography sx={{ color: palette.muted }}>
                      {[market.city, market.state, market.country].filter(Boolean).join(", ") || "Location not available"}
                    </Typography>
                  </Stack>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Chip icon={<StorefrontIcon />} label={`${shopData?.total || 0} shops`} />
                  <Chip label={`${productData?.total || 0} products`} />
                </Stack>
              </Stack>
            </Paper>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2.2, borderRadius: 1 }}>
                  <Typography sx={{ fontWeight: 700, color: palette.ink, mb: 1 }}>Top Shops</Typography>
                  <Divider sx={{ mb: 1.5 }} />
                  <Stack spacing={1}>
                    {shops.length === 0 ? (
                      <Typography color="text.secondary">No shops found in this market.</Typography>
                    ) : (
                      shops.map((shop: any) => (
                        <Card key={shop._id} sx={{ p: 1.2, borderRadius: 1, cursor: "pointer" }} onClick={() => navigate(toShopUrl(shop))}>
                          <Typography sx={{ fontWeight: 700, color: palette.ink }}>{shop.name}</Typography>
                          <Typography sx={{ color: palette.muted, fontSize: 13 }}>{shop.contactPhone || "No phone"}</Typography>
                        </Card>
                      ))
                    )}
                  </Stack>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2.2, borderRadius: 1 }}>
                  <Typography sx={{ fontWeight: 700, color: palette.ink, mb: 1 }}>Latest Products</Typography>
                  <Divider sx={{ mb: 1.5 }} />
                  <Stack spacing={1}>
                    {products.length === 0 ? (
                      <Typography color="text.secondary">No products found in this market.</Typography>
                    ) : (
                      products.map((product: any) => (
                        <Card key={product._id} sx={{ p: 1.2, borderRadius: 1, cursor: "pointer" }} onClick={() => navigate(toProductUrl(product))}>
                          <Typography sx={{ fontWeight: 700, color: palette.ink }}>{product.name}</Typography>
                          <Typography sx={{ color: palette.muted, fontSize: 13 }}>Rs {Number(product.salePrice || 0).toLocaleString()}</Typography>
                        </Card>
                      ))
                    )}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Stack>
        )}
      </Container>
      <PublicFooter />
    </Box>

  );
}
