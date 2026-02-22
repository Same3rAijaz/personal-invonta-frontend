import React from "react";
import {
  Box,
  Button,
  Card,
  Chip,
  Container,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ViewListIcon from "@mui/icons-material/ViewList";
import GridViewIcon from "@mui/icons-material/GridView";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listPublicCategories, listPublicMarkets, listPublicProducts, listPublicShops } from "../../api/public";
import { useCities, useCountries, useStates } from "../../hooks/useGeo";

const LIMIT = 12;

export default function Marketplace() {
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
  const [search, setSearch] = React.useState("");
  const [marketId, setMarketId] = React.useState("");
  const [country, setCountry] = React.useState("");
  const [state, setState] = React.useState("");
  const [city, setCity] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [minPrice, setMinPrice] = React.useState("");
  const [maxPrice, setMaxPrice] = React.useState("");
  const [resultType, setResultType] = React.useState<"products" | "shops">("products");
  const [sort, setSort] = React.useState<"newest" | "price_asc" | "price_desc" | "name_asc">("newest");
  const [shopSort, setShopSort] = React.useState<"newest" | "name_asc">("newest");
  const [viewMode, setViewMode] = React.useState<"list" | "grid">("list");
  const [page, setPage] = React.useState(1);
  const { data: countryOptions = [] } = useCountries();
  const { data: stateOptions = [] } = useStates(country);
  const { data: cityOptions = [] } = useCities(country, state);

  React.useEffect(() => {
    if (state && !stateOptions.some((item: string) => item === state)) {
      setState("");
      setCity("");
      setPage(1);
    }
  }, [state, stateOptions]);

  React.useEffect(() => {
    if (city && !cityOptions.some((item: string) => item === city)) {
      setCity("");
      setPage(1);
    }
  }, [city, cityOptions]);

  const { data: markets = [] } = useQuery({
    queryKey: ["public-markets"],
    queryFn: () => listPublicMarkets()
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["public-categories", marketId],
    queryFn: () => listPublicCategories(marketId || undefined)
  });

  const { data: productData, isLoading: isProductsLoading } = useQuery({
    queryKey: ["public-products", page, LIMIT, search, marketId, country, state, city, category, minPrice, maxPrice, sort],
    queryFn: () =>
      listPublicProducts({
        page,
        limit: LIMIT,
        search: search || undefined,
        marketId: marketId || undefined,
        country: country || undefined,
        state: state || undefined,
        city: city || undefined,
        category: category || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sort
      }),
    enabled: resultType === "products"
  });

  const { data: shopData, isLoading: isShopsLoading } = useQuery({
    queryKey: ["public-shops", page, LIMIT, search, marketId, country, state, city, category, shopSort],
    queryFn: () =>
      listPublicShops({
        page,
        limit: LIMIT,
        search: search || undefined,
        marketId: marketId || undefined,
        country: country || undefined,
        state: state || undefined,
        city: city || undefined,
        category: category || undefined,
        sort: shopSort
      }),
    enabled: resultType === "shops"
  });

  const data = resultType === "shops" ? shopData : productData;
  const isLoading = resultType === "shops" ? isShopsLoading : isProductsLoading;
  const total = data?.total || 0;
  const pages = Math.max(1, Math.ceil(total / LIMIT));
  const products = data?.items || [];

  const resetFilters = () => {
    setSearch("");
    setMarketId("");
    setCountry("");
    setState("");
    setCity("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setResultType("products");
    setSort("newest");
    setShopSort("newest");
    setPage(1);
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: palette.canvas }}>
      <Box sx={{ borderBottom: `1px solid ${alpha("#ffffff", 0.14)}`, background: `linear-gradient(90deg, ${palette.navStart} 0%, ${palette.navEnd} 100%)` }}>
        <Container maxWidth="xl" sx={{ py: 1.2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
            <Stack direction="row" alignItems="center" spacing={3}>
              <Stack direction="row" alignItems="center" spacing={1.2}>
                <Box component="img" src="/Invonta.png" alt="Invonta" sx={{ width: 36, height: 36 }} />
                <Typography sx={{ fontWeight: 800, fontSize: 30, color: "#ffffff", lineHeight: 1 }}>
                  Invonta
                </Typography>
              </Stack>
              <Typography sx={{ fontWeight: 700, color: alpha("#ffffff", 0.9), display: { xs: "none", md: "block" } }}>Marketplace</Typography>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography component={Link} to="/login" sx={{ color: "#ffffff", fontWeight: 700, textDecoration: "underline" }}>
                Login
              </Typography>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Box sx={{ borderBottom: `1px solid ${palette.line}`, backgroundColor: palette.surface }}>
        <Container maxWidth="xl" sx={{ py: 2 }}>
          <Grid container spacing={1.5}>
            <Grid item xs={12} md={3.5}>
              <FormControl fullWidth>
                <InputLabel>Location</InputLabel>
                <Select
                  value={marketId}
                  label="Location"
                  onChange={(event) => {
                    setMarketId(event.target.value);
                    setPage(1);
                  }}
                  IconComponent={KeyboardArrowDownIcon}
                  startAdornment={<LocationOnOutlinedIcon sx={{ color: palette.accent, mr: 1 }} />}
                  sx={{ bgcolor: palette.surface, borderRadius: 0.8 }}
                >
                  <MenuItem value="">All Markets</MenuItem>
                  {markets.map((market: any) => (
                    <MenuItem key={market._id} value={market._id}>
                      {market.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={8.5}>
              <Stack direction="row">
                <TextField
                  fullWidth
                  placeholder="Find products, SKU, shops and more..."
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                      bgcolor: palette.surface
                    }
                  }}
                />
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  sx={{
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                    px: 4,
                    backgroundColor: palette.navStart
                  }}
                >
                  Search
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="body2" sx={{ color: palette.muted, mb: 1 }}>
          Home
        </Typography>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ color: palette.ink, fontWeight: 800 }}>
            {resultType === "shops" ? "Shops in Marketplace" : "Products in Marketplace"}
          </Typography>
          <Chip label={`${total.toLocaleString()} Results`} sx={{ bgcolor: alpha(palette.accent, 0.18), color: palette.ink, fontWeight: 700 }} />
        </Stack>

        <Grid container spacing={2.5} alignItems="flex-start">
          <Grid item xs={12} md={3.3}>
            <Paper sx={{ borderRadius: 1, p: 2, mb: 1.8 }}>
              <Typography variant="h6" sx={{ color: palette.ink, fontWeight: 800, mb: 2 }}>
                Categories
              </Typography>
              <Stack spacing={1}>
                <Button
                  onClick={() => {
                    setCategory("");
                    setPage(1);
                  }}
                  sx={{ justifyContent: "flex-start", color: category ? palette.muted : palette.ink, fontWeight: category ? 500 : 700 }}
                >
                  All categories
                </Button>
                {categories.map((item: string) => (
                  <Button
                    key={item}
                    onClick={() => {
                      setCategory(item);
                      setPage(1);
                    }}
                    sx={{ justifyContent: "flex-start", color: category === item ? palette.ink : palette.muted, fontWeight: category === item ? 700 : 500 }}
                  >
                    {item}
                  </Button>
                ))}
              </Stack>
            </Paper>

            <Paper sx={{ borderRadius: 1, p: 2, mb: 1.8 }}>
              <Typography variant="h6" sx={{ color: palette.ink, fontWeight: 800, mb: 1.5 }}>
                Location
              </Typography>
              <Stack spacing={1}>
                <TextField
                  select
                  fullWidth
                  label="Country"
                  value={country}
                  onChange={(event) => {
                    setCountry(event.target.value);
                    setState("");
                    setCity("");
                    setPage(1);
                  }}
                >
                  <MenuItem value="">Select Country</MenuItem>
                  {countryOptions.map((item: string) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  fullWidth
                  label="State"
                  value={state}
                  disabled={!country}
                  onChange={(event) => {
                    setState(event.target.value);
                    setCity("");
                    setPage(1);
                  }}
                >
                  <MenuItem value="">Select State</MenuItem>
                  {stateOptions.map((item: string) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  fullWidth
                  label="City"
                  value={city}
                  disabled={!country || !state}
                  onChange={(event) => {
                    setCity(event.target.value);
                    setPage(1);
                  }}
                >
                  <MenuItem value="">Select City</MenuItem>
                  {cityOptions.map((item: string) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            </Paper>

            {resultType === "products" ? (
              <Paper sx={{ borderRadius: 1, p: 2, mb: 1.8 }}>
                <Typography variant="h6" sx={{ color: palette.ink, fontWeight: 800, mb: 1.5 }}>
                  Price
                </Typography>
                <Stack direction="row" spacing={1}>
                  <TextField
                    fullWidth
                    label="Min"
                    type="number"
                    value={minPrice}
                    onChange={(event) => {
                      setMinPrice(event.target.value);
                      setPage(1);
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Max"
                    type="number"
                    value={maxPrice}
                    onChange={(event) => {
                      setMaxPrice(event.target.value);
                      setPage(1);
                    }}
                  />
                </Stack>
              </Paper>
            ) : null}

            <Paper sx={{ borderRadius: 1, p: 2 }}>
              <Typography variant="h6" sx={{ color: palette.ink, fontWeight: 800, mb: 1.5 }}>
                Filters
              </Typography>
              <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={resultType === "shops" ? shopSort : sort}
                  label="Sort by"
                  onChange={(event) => {
                    if (resultType === "shops") {
                      setShopSort(event.target.value as "newest" | "name_asc");
                    } else {
                      setSort(event.target.value as "newest" | "price_asc" | "price_desc" | "name_asc");
                    }
                    setPage(1);
                  }}
                >
                  <MenuItem value="newest">Most relevant</MenuItem>
                  {resultType === "products" ? <MenuItem value="price_asc">Price: Low to High</MenuItem> : null}
                  {resultType === "products" ? <MenuItem value="price_desc">Price: High to Low</MenuItem> : null}
                  <MenuItem value="name_asc">Name A-Z</MenuItem>
                </Select>
              </FormControl>
              <Button fullWidth variant="outlined" onClick={resetFilters}>
                Clear All
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8.7}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5, px: 0.5 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Button
                  variant={resultType === "products" ? "contained" : "outlined"}
                  onClick={() => {
                    setResultType("products");
                    setPage(1);
                  }}
                  sx={{ minWidth: 110 }}
                >
                  Products
                </Button>
                <Button
                  variant={resultType === "shops" ? "contained" : "outlined"}
                  onClick={() => {
                    setResultType("shops");
                    setPage(1);
                  }}
                  sx={{ minWidth: 110 }}
                >
                  Shops
                </Button>
                {resultType === "products" ? (
                  <>
                    <Typography sx={{ color: palette.ink, fontWeight: 700, ml: 1 }}>View</Typography>
                    <IconButton
                      onClick={() => setViewMode("list")}
                      sx={{ bgcolor: viewMode === "list" ? alpha(palette.accent, 0.18) : "transparent" }}
                    >
                      <ViewListIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => setViewMode("grid")}
                      sx={{ bgcolor: viewMode === "grid" ? alpha(palette.accent, 0.18) : "transparent" }}
                    >
                      <GridViewIcon />
                    </IconButton>
                  </>
                ) : null}
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ color: palette.ink, fontWeight: 700 }}>Sort by:</Typography>
                <Typography sx={{ color: palette.muted }}>
                  {(resultType === "shops" ? shopSort : sort) === "newest"
                    ? "Most relevant"
                    : (resultType === "shops" ? shopSort : sort) === "price_asc"
                      ? "Price low to high"
                      : (resultType === "shops" ? shopSort : sort) === "price_desc"
                        ? "Price high to low"
                        : "Name A-Z"}
                </Typography>
                <KeyboardArrowDownIcon />
              </Stack>
            </Stack>
            <Divider sx={{ mb: 2 }} />

            {isLoading ? (
              <Paper sx={{ p: 4, borderRadius: 1 }}>
                <Typography color="text.secondary">Loading {resultType}...</Typography>
              </Paper>
            ) : products.length === 0 ? (
              <Paper sx={{ p: 4, borderRadius: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: palette.ink }}>No {resultType} found</Typography>
                <Typography color="text.secondary">Try another market, category, or search keyword.</Typography>
              </Paper>
            ) : resultType === "shops" ? (
              <Stack spacing={1.8}>
                {products.map((shop: any) => {
                  const market = shop.marketId || {};
                  return (
                    <Card key={shop._id} sx={{ borderRadius: 1, border: `1px solid ${palette.line}`, cursor: "pointer" }} onClick={() => navigate(`/marketplace/shops/${shop._id}`)}>
                      <Box sx={{ p: 2.2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                          <Box>
                            <Typography sx={{ fontSize: 31, lineHeight: 1.1, fontWeight: 800, color: palette.ink }}>
                              {shop.name}
                            </Typography>
                            <Typography sx={{ mt: 0.9, color: palette.muted, fontSize: 17 }}>
                              {market.name || "Market"} - {shop.city || "City"}{shop.state ? `, ${shop.state}` : ""}
                            </Typography>
                            <Typography sx={{ mt: 1.2, color: palette.muted, fontSize: 16 }}>
                              {shop.address || "Shop address not available"}
                            </Typography>
                            <Typography sx={{ mt: 1.1, color: palette.ink, fontWeight: 800, fontSize: 17 }}>
                              {shop.contactPhone || "Contact not available"}
                            </Typography>
                          </Box>
                          <Chip
                            icon={<StorefrontIcon />}
                            label={`${Number(shop.publicProductsCount || 0).toLocaleString()} public products`}
                            sx={{ bgcolor: alpha(palette.accent, 0.18), color: palette.ink, fontWeight: 700 }}
                          />
                        </Stack>
                      </Box>
                    </Card>
                  );
                })}
              </Stack>
            ) : viewMode === "list" ? (
              <Stack spacing={1.8}>
                {products.map((product: any) => {
                  const business = product.businessId || {};
                  const market = business.marketId || {};
                  return (
                    <Card key={product._id} sx={{ borderRadius: 1, border: `1px solid ${palette.line}`, cursor: "pointer" }} onClick={() => navigate(`/marketplace/${product._id}`)}>
                      <Grid container>
                        <Grid item xs={12} sm={4.2}>
                          <Box
                            component="img"
                            src={product.thumbnailUrl || "/Invonta.png"}
                            alt={product.name}
                            sx={{ width: "100%", height: { xs: 220, sm: 210 }, objectFit: "cover", display: "block" }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={7.8}>
                          <Box sx={{ p: 2 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                              <Box>
                                <Typography sx={{ fontSize: 38, lineHeight: 1, fontWeight: 800, color: palette.ink }}>
                                  Rs {Number(product.salePrice || 0).toLocaleString()}
                                </Typography>
                                <Typography sx={{ mt: 0.8, fontSize: 31, fontWeight: 500, color: palette.ink }}>
                                  {product.name}
                                </Typography>
                              </Box>
                              <IconButton onClick={(event) => event.stopPropagation()}>
                                <FavoriteBorderIcon />
                              </IconButton>
                            </Stack>
                            <Typography sx={{ mt: 1, color: palette.muted, fontSize: 18 }}>
                              SKU: {product.sku || "-"} {product.category ? `- ${product.category}` : ""}
                            </Typography>
                            <Typography sx={{ mt: 2, color: palette.muted, fontSize: 17 }}>
                              {business.address || "Shop address not available"} - {market.name || "Market"} - {business.name || "Shop"}
                            </Typography>
                            <Typography sx={{ mt: 1.4, color: palette.ink, fontWeight: 800, fontSize: 18 }}>
                              {business.contactPhone || "Contact not available"}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Card>
                  );
                })}
              </Stack>
            ) : (
              <Grid container spacing={1.8}>
                {products.map((product: any) => {
                  const business = product.businessId || {};
                  const market = business.marketId || {};
                  return (
                    <Grid key={product._id} item xs={12} sm={6}>
                      <Card sx={{ borderRadius: 1, border: `1px solid ${palette.line}`, height: "100%", cursor: "pointer" }} onClick={() => navigate(`/marketplace/${product._id}`)}>
                        <Box
                          component="img"
                          src={product.thumbnailUrl || "/Invonta.png"}
                          alt={product.name}
                          sx={{ width: "100%", height: 210, objectFit: "cover", display: "block" }}
                        />
                        <Box sx={{ p: 1.8 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Typography sx={{ fontSize: 26, lineHeight: 1, fontWeight: 800, color: palette.ink }}>
                              Rs {Number(product.salePrice || 0).toLocaleString()}
                            </Typography>
                            <IconButton size="small" onClick={(event) => event.stopPropagation()}>
                              <FavoriteBorderIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                          <Typography sx={{ mt: 0.7, fontSize: 22, fontWeight: 600, color: palette.ink }}>
                            {product.name}
                          </Typography>
                          <Typography sx={{ mt: 0.6, color: palette.muted, fontSize: 15 }}>
                            SKU: {product.sku || "-"} {product.category ? `- ${product.category}` : ""}
                          </Typography>
                          <Typography sx={{ mt: 1.2, color: palette.muted, fontSize: 14 }}>
                            {market.name || "Market"} - {business.name || "Shop"}
                          </Typography>
                          <Typography sx={{ mt: 0.6, color: palette.ink, fontWeight: 700, fontSize: 15 }}>
                            {business.contactPhone || "Contact not available"}
                          </Typography>
                        </Box>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}

            {pages > 1 ? (
              <Stack direction="row" justifyContent="center" sx={{ mt: 3 }}>
                <Pagination page={page} count={pages} color="primary" onChange={(_event, value) => setPage(value)} />
              </Stack>
            ) : null}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
