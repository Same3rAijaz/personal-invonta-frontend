import React from "react";
import {
  Box,
  Button,
  Card,
  Chip,
  Container,
  Divider,
  Grid,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import StorefrontIcon from "@mui/icons-material/Storefront";
import PlaceIcon from "@mui/icons-material/Place";
import PhoneIcon from "@mui/icons-material/Phone";
import SearchIcon from "@mui/icons-material/Search";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPublicShopDetail } from "../../api/public";

const LIMIT = 12;

export default function MarketplaceShopDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const palette = {
    navStart: "#0b1220",
    navEnd: "#1f2a40",
    canvas: "#d7dce4",
    surface: "#ffffff",
    ink: "#0b1220",
    muted: "#51607a",
    accent: "#21a6df",
    line: alpha("#0b1220", 0.14)
  };

  const [page, setPage] = React.useState(1);
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("");
  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["public-shop-detail", id, page, search, category],
    queryFn: () =>
      getPublicShopDetail(id, {
        page,
        limit: LIMIT,
        search: search || undefined,
        category: category || undefined,
        sort: "newest"
      }),
    enabled: Boolean(id),
    placeholderData: (previousData) => previousData
  });

  const shop = data?.shop;
  const market = shop?.marketId || {};
  const inventory = data?.inventory?.items || [];
  const total = data?.inventory?.total || 0;
  const pages = Math.max(1, Math.ceil(total / LIMIT));
  const categories = data?.categories || [];

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: palette.canvas }}>
      <Box sx={{ borderBottom: `1px solid ${alpha("#ffffff", 0.14)}`, background: `linear-gradient(90deg, ${palette.navStart} 0%, ${palette.navEnd} 100%)` }}>
        <Container maxWidth="xl" sx={{ py: 1.2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
            <Stack direction="row" alignItems="center" spacing={1.2}>
              <Box component="img" src="/Invonta.png" alt="Invonta" sx={{ width: 34, height: 34 }} />
              <Typography sx={{ fontWeight: 800, fontSize: 28, color: "#ffffff", lineHeight: 1 }}>Invonta</Typography>
              <Typography sx={{ fontWeight: 700, color: alpha("#ffffff", 0.9), ml: 1, display: { xs: "none", md: "block" } }}>Marketplace</Typography>
            </Stack>
            <Typography component={Link} to="/login" sx={{ color: "#ffffff", fontWeight: 700, textDecoration: "underline" }}>
              Login
            </Typography>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/marketplace")} sx={{ color: palette.ink, mb: 2 }}>
          Back to Marketplace
        </Button>

        {isLoading && !data ? (
          <Paper sx={{ p: 4, borderRadius: 1 }}>
            <Typography color="text.secondary">Loading shop...</Typography>
          </Paper>
        ) : !shop ? (
          <Paper sx={{ p: 4, borderRadius: 1 }}>
            <Typography variant="h6" sx={{ color: palette.ink, fontWeight: 700 }}>Shop not found</Typography>
          </Paper>
        ) : (
          <Grid container spacing={2.5} alignItems="flex-start">
            <Grid item xs={12} md={3.7}>
              <Paper sx={{ borderRadius: 1, p: 2.2 }}>
                <Typography sx={{ color: palette.muted, fontSize: 13 }}>Shop profile</Typography>
                <Typography sx={{ color: palette.ink, fontWeight: 800, fontSize: 24, mt: 0.3 }}>
                  {shop.name}
                </Typography>
                <Divider sx={{ my: 1.5 }} />
                <Stack spacing={1.1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <StorefrontIcon fontSize="small" sx={{ color: palette.accent }} />
                    <Typography sx={{ color: palette.muted }}>{market?.name || "Market not set"}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PlaceIcon fontSize="small" sx={{ color: palette.accent }} />
                    <Typography sx={{ color: palette.muted }}>{shop.address || "Address not available"}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PhoneIcon fontSize="small" sx={{ color: palette.accent }} />
                    <Typography sx={{ color: palette.ink, fontWeight: 700 }}>{shop.contactPhone || "Contact not available"}</Typography>
                  </Stack>
                </Stack>
                <Chip label={`${total.toLocaleString()} public products`} sx={{ mt: 1.7, bgcolor: alpha(palette.accent, 0.18), color: palette.ink, fontWeight: 700 }} />
              </Paper>
            </Grid>

            <Grid item xs={12} md={8.3}>
              <Paper sx={{ borderRadius: 1, p: 2, mb: 2 }}>
                <Grid container spacing={1.2}>
                  <Grid item xs={12} md={8}>
                    <TextField
                      fullWidth
                      placeholder="Search this shop's products..."
                      value={searchInput}
                      onChange={(event) => {
                        setSearchInput(event.target.value);
                      }}
                      InputProps={{ startAdornment: <SearchIcon sx={{ color: palette.muted, mr: 1 }} /> }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      select
                      fullWidth
                      label="Category"
                      value={category}
                      onChange={(event) => {
                        setCategory(event.target.value);
                        setPage(1);
                      }}
                    >
                      <MenuItem value="">All categories</MenuItem>
                      {categories.map((item: string) => (
                        <MenuItem key={item} value={item}>
                          {item}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
              </Paper>
              {isFetching ? (
                <Typography sx={{ color: palette.muted, fontSize: 13, mb: 1 }}>Updating results...</Typography>
              ) : null}

              {inventory.length === 0 ? (
                <Paper sx={{ p: 3, borderRadius: 1 }}>
                  <Typography sx={{ color: palette.ink, fontWeight: 700 }}>No public products found</Typography>
                </Paper>
              ) : (
                <Stack spacing={1.6}>
                  {inventory.map((item: any) => (
                    <Card
                      key={item._id}
                      onClick={() => navigate(`/marketplace/${item._id}`)}
                      sx={{ borderRadius: 1, border: `1px solid ${palette.line}`, cursor: "pointer" }}
                    >
                      <Grid container>
                        <Grid item xs={12} sm={4.2}>
                          <Box component="img" src={item.thumbnailUrl || "/Invonta.png"} alt={item.name} sx={{ width: "100%", height: { xs: 200, sm: 180 }, objectFit: "cover", display: "block" }} />
                        </Grid>
                        <Grid item xs={12} sm={7.8}>
                          <Box sx={{ p: 2 }}>
                            <Typography sx={{ fontSize: 34, lineHeight: 1, fontWeight: 800, color: palette.ink }}>
                              Rs {Number(item.salePrice || 0).toLocaleString()}
                            </Typography>
                            <Typography sx={{ mt: 0.7, fontSize: 28, fontWeight: 500, color: palette.ink }}>
                              {item.name}
                            </Typography>
                            <Typography sx={{ mt: 1, color: palette.muted, fontSize: 16 }}>
                              SKU: {item.sku || "-"} {item.category ? `- ${item.category}` : ""}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Card>
                  ))}
                </Stack>
              )}

              {pages > 1 ? (
                <Stack direction="row" justifyContent="center" sx={{ mt: 2.2 }}>
                  <Pagination count={pages} page={page} onChange={(_, value) => setPage(value)} />
                </Stack>
              ) : null}
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
}
