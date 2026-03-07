import React from "react";
import {
  Avatar,
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
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ViewListIcon from "@mui/icons-material/ViewList";
import GridViewIcon from "@mui/icons-material/GridView";
import StorefrontIcon from "@mui/icons-material/Storefront";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import PhoneIcon from "@mui/icons-material/Phone";
import LanguageIcon from "@mui/icons-material/Language";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PublicCategoryNode, getPublicProductDetail, getPublicShopDetail, listPublicCategories, listPublicMarkets, listPublicProducts, listPublicShops, semanticSearchPublicProducts, semanticSearchPublicShops } from "../../api/public";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { Switch, FormControlLabel } from "@mui/material";
import { useCities, useCountries, useStates } from "../../hooks/useGeo";
import MarketplaceHeader from "../../components/marketplace-detail/MarketplaceHeader";
import PublicFooter from "../../components/marketplace-detail/PublicFooter";
import { toMarketUrl, toProductUrl, toShopUrl } from "../../utils/seo";


const LIMIT = 12;

export default function Marketplace() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
  const [resultType, setResultType] = React.useState<"products" | "shops" | "markets">("products");
  const [sort, setSort] = React.useState<"newest" | "price_asc" | "price_desc" | "name_asc">("newest");
  const [shopSort, setShopSort] = React.useState<"newest" | "name_asc">("newest");
  const [marketSort, setMarketSort] = React.useState<"name_asc" | "name_desc" | "newest">("name_asc");
  const [viewMode, setViewMode] = React.useState<"list" | "grid">("list");
  const [page, setPage] = React.useState(1);
  const [semanticMode, setSemanticMode] = React.useState(false);
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

  const { data: categories = [] } = useQuery<PublicCategoryNode[]>({
    queryKey: ["public-categories", marketId],
    queryFn: () => listPublicCategories(marketId || undefined),
    enabled: resultType !== "markets"
  });

  const { data: productData, isLoading: isProductsLoading } = useQuery({
    queryKey: ["public-products", page, LIMIT, search, marketId, country, state, city, category, minPrice, maxPrice, sort, semanticMode],
    queryFn: () => {
      if (semanticMode && search.trim()) {
        return semanticSearchPublicProducts({
          query: search,
          limit: LIMIT,
          marketId: marketId || undefined,
          country: country || undefined,
          state: state || undefined,
          city: city || undefined,
          category: category || undefined,
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined
        });
      }
      return listPublicProducts({
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
      });
    },
    enabled: resultType === "products"
  });

  const { data: shopData, isLoading: isShopsLoading } = useQuery({
    queryKey: ["public-shops", page, LIMIT, search, marketId, country, state, city, category, shopSort, semanticMode],
    queryFn: () => {
      if (semanticMode && search.trim()) {
        return semanticSearchPublicShops({
          query: search,
          limit: LIMIT,
          marketId: marketId || undefined,
          country: country || undefined,
          state: state || undefined,
          city: city || undefined,
          category: category || undefined
        });
      }
      return listPublicShops({
        page,
        limit: LIMIT,
        search: search || undefined,
        marketId: marketId || undefined,
        country: country || undefined,
        state: state || undefined,
        city: city || undefined,
        category: category || undefined,
        sort: shopSort
      });
    },
    enabled: resultType === "shops"
  });

  const marketResults = React.useMemo(() => {
    let items = [...(markets as any[])];
    if (search.trim()) {
      const keyword = search.trim().toLowerCase();
      items = items.filter((item) => String(item?.name || "").toLowerCase().includes(keyword));
    }
    if (marketId) {
      items = items.filter((item) => String(item?._id) === String(marketId));
    }
    if (country) {
      items = items.filter((item) => String(item?.country || "") === country);
    }
    if (state) {
      items = items.filter((item) => String(item?.state || "") === state);
    }
    if (city) {
      items = items.filter((item) => String(item?.city || "") === city);
    }
    if (marketSort === "name_asc") {
      items.sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || "")));
    } else if (marketSort === "name_desc") {
      items.sort((a, b) => String(b?.name || "").localeCompare(String(a?.name || "")));
    } else {
      items.sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime());
    }
    return items;
  }, [markets, search, marketId, country, state, city, marketSort]);

  const marketPagedItems = React.useMemo(() => {
    const start = (page - 1) * LIMIT;
    return marketResults.slice(start, start + LIMIT);
  }, [marketResults, page]);

  const data = resultType === "shops" ? shopData : resultType === "products" ? productData : null;
  const isLoading = resultType === "shops" ? isShopsLoading : resultType === "products" ? isProductsLoading : false;
  const total = resultType === "markets" ? marketResults.length : data?.total || 0;
  const pages = Math.max(1, Math.ceil(total / LIMIT));
  const items = resultType === "markets" ? marketPagedItems : data?.items || [];
  const currentSortValue = resultType === "shops" ? shopSort : resultType === "markets" ? marketSort : sort;

  const getSortLabel = (value: string) => {
    if (value === "newest") return resultType === "markets" ? "Newest markets" : "Most relevant";
    if (value === "price_asc") return "Price low to high";
    if (value === "price_desc") return "Price high to low";
    if (value === "name_desc") return "Name Z-A";
    return "Name A-Z";
  };

  const handleSortChange = (value: string) => {
    if (resultType === "shops") {
      setShopSort(value as "newest" | "name_asc");
    } else if (resultType === "markets") {
      setMarketSort(value as "newest" | "name_asc" | "name_desc");
    } else {
      setSort(value as "newest" | "price_asc" | "price_desc" | "name_asc");
    }
    setPage(1);
  };

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
    setMarketSort("name_asc");
    setPage(1);
  };

  const prefetchProductDetail = React.useCallback(
    (id?: string) => {
      if (!id) return;
      queryClient.prefetchQuery({
        queryKey: ["public-product-detail", id],
        queryFn: () => getPublicProductDetail(id),
        staleTime: 60 * 1000
      });
    },
    [queryClient]
  );

  const prefetchShopDetail = React.useCallback(
    (id?: string) => {
      if (!id) return;
      queryClient.prefetchQuery({
        queryKey: ["public-shop-detail", id, 1, "", ""],
        queryFn: () =>
          getPublicShopDetail(id, {
            page: 1,
            limit: LIMIT,
            sort: "newest"
          }),
        staleTime: 60 * 1000
      });
    },
    [queryClient]
  );

  const toHref = (value?: string) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    return `https://${raw}`;
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: palette.canvas }}>
      <MarketplaceHeader
        markets={markets}
        selectedMarketId={marketId}
        onMarketChange={(value) => {
          setMarketId(value);
          setPage(1);
        }}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        onSearchSubmit={() => setPage(1)}
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="body2" sx={{ color: palette.muted, mb: 1 }}>
          Home
        </Typography>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
          <Typography variant="h5" sx={{ color: palette.ink, fontWeight: 800, fontSize: { xs: 18, md: 22 } }}>
            {resultType === "shops" ? "Shops in Marketplace" : resultType === "markets" ? "Markets Directory" : "Products in Marketplace"}
          </Typography>
          <Chip label={`${total.toLocaleString()} Results`} size="small" sx={{ bgcolor: alpha(palette.accent, 0.18), color: palette.ink, fontWeight: 700, fontSize: 12 }} />
        </Stack>

        <Grid container spacing={2} alignItems="flex-start">
          <Grid item xs={12} md={2.8}>
            {resultType !== "markets" ? (
              <Paper sx={{ borderRadius: 1, p: 1.5, mb: 1.5 }}>
                <Typography variant="subtitle1" sx={{ color: palette.ink, fontWeight: 800, mb: 1.5, fontSize: 14 }}>
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
                  {categories.map((item) => (
                    <Button
                      key={item._id}
                      onClick={() => {
                        setCategory(item.path || (item.pathNames || [item.name]).join(" > "));
                        setPage(1);
                      }}
                      sx={{
                        justifyContent: "flex-start",
                        pl: 1.4 + Number(item.level || 0) * 1.8,
                        color: category === (item.path || (item.pathNames || [item.name]).join(" > ")) ? palette.ink : palette.muted,
                        fontWeight: category === (item.path || (item.pathNames || [item.name]).join(" > ")) ? 700 : 500
                      }}
                    >
                      {item.name}
                    </Button>
                  ))}
                </Stack>
              </Paper>
            ) : null}

            <Paper sx={{ borderRadius: 1, p: 1.5, mb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ color: palette.ink, fontWeight: 800, mb: 1, fontSize: 14 }}>
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
              <Paper sx={{ borderRadius: 1, p: 1.5, mb: 1.5 }}>
                <Typography variant="subtitle1" sx={{ color: palette.ink, fontWeight: 800, mb: 1, fontSize: 14 }}>
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

            {resultType !== "markets" && (
              <Paper sx={{ borderRadius: 1, p: 1.5, mb: 1.5, background: semanticMode ? alpha(palette.accent, 0.05) : undefined, border: semanticMode ? `1px solid ${palette.accent}` : undefined }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AutoAwesomeIcon sx={{ color: semanticMode ? palette.accent : palette.muted, fontSize: 18 }} />
                    <Typography variant="subtitle1" sx={{ color: palette.ink, fontWeight: 800, fontSize: 14 }}>
                      AI Search
                    </Typography>
                  </Stack>
                  <Switch 
                    checked={semanticMode} 
                    onChange={(e) => {
                      setSemanticMode(e.target.checked);
                      setPage(1);
                    }} 
                    size="small"
                    color="primary"
                  />
                </Stack>
                <Typography variant="caption" sx={{ color: palette.muted, display: "block", mt: 0.5 }}>
                  Find products naturally by description, skip exact keywords.
                </Typography>
              </Paper>
            )}

            <Paper sx={{ borderRadius: 1, p: 1.5 }}>
              <Typography variant="subtitle1" sx={{ color: palette.ink, fontWeight: 800, mb: 1, fontSize: 14 }}>
                Filters
              </Typography>
              <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={currentSortValue}
                  label="Sort by"
                  onChange={(event) => handleSortChange(event.target.value)}
                >
                  <MenuItem value="newest">{resultType === "markets" ? "Newest markets" : "Most relevant"}</MenuItem>
                  {resultType === "products" ? <MenuItem value="price_asc">Price: Low to High</MenuItem> : null}
                  {resultType === "products" ? <MenuItem value="price_desc">Price: High to Low</MenuItem> : null}
                  <MenuItem value="name_asc">Name A-Z</MenuItem>
                  {resultType === "markets" ? <MenuItem value="name_desc">Name Z-A</MenuItem> : null}
                </Select>
              </FormControl>
              <Button fullWidth variant="outlined" onClick={resetFilters}>
                Clear All
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={9.2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5, px: 0.5 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Button
                  variant={resultType === "products" ? "contained" : "outlined"}
                  onClick={() => {
                    setResultType("products");
                    setPage(1);
                  }}
                  size="small"
                  sx={{ minWidth: 90, fontSize: 13 }}
                >
                  Products
                </Button>
                <Button
                  variant={resultType === "shops" ? "contained" : "outlined"}
                  onClick={() => {
                    setResultType("shops");
                    setPage(1);
                  }}
                  size="small"
                  sx={{ minWidth: 90, fontSize: 13 }}
                >
                  Shops
                </Button>
                <Button
                  variant={resultType === "markets" ? "contained" : "outlined"}
                  onClick={() => {
                    setResultType("markets");
                    setPage(1);
                  }}
                  size="small"
                  sx={{ minWidth: 90, fontSize: 13 }}
                >
                  Markets
                </Button>
                {resultType === "products" ? (
                  <>
                    <Typography sx={{ color: palette.ink, fontWeight: 700, ml: 1, fontSize: 13 }}>View</Typography>
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
                <Typography sx={{ color: palette.ink, fontWeight: 700, fontSize: 13 }}>Sort by:</Typography>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <Select
                    value={currentSortValue}
                    onChange={(event) => handleSortChange(event.target.value)}
                    variant="standard"
                    disableUnderline
                    renderValue={(value) => getSortLabel(String(value))}
                    sx={{
                      color: palette.muted,
                      "& .MuiSelect-select": { py: 0.25, pr: 3.5 },
                      "& .MuiSelect-icon": { color: palette.ink }
                    }}
                  >
                    <MenuItem value="newest">{resultType === "markets" ? "Newest markets" : "Most relevant"}</MenuItem>
                    {resultType === "products" ? <MenuItem value="price_asc">Price: Low to High</MenuItem> : null}
                    {resultType === "products" ? <MenuItem value="price_desc">Price: High to Low</MenuItem> : null}
                    <MenuItem value="name_asc">Name A-Z</MenuItem>
                    {resultType === "markets" ? <MenuItem value="name_desc">Name Z-A</MenuItem> : null}
                  </Select>
                </FormControl>
              </Stack>
            </Stack>
            <Divider sx={{ mb: 2 }} />

            {isLoading ? (
              <Paper sx={{ p: 4, borderRadius: 1 }}>
                <Typography color="text.secondary">Loading {resultType}...</Typography>
              </Paper>
            ) : items.length === 0 ? (
              <Paper sx={{ p: 4, borderRadius: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: palette.ink }}>No {resultType} found</Typography>
                <Typography color="text.secondary">Try another market, category, or search keyword.</Typography>
              </Paper>
            ) : resultType === "shops" ? (
              <Stack spacing={1.8}>
                {items.map((shop: any) => {
                  const market = shop.marketId || {};
                  return (
                    <Card
                      key={shop._id}
                      sx={{ borderRadius: 1.5, border: `1px solid ${palette.line}`, cursor: "pointer", overflow: "hidden", transition: "box-shadow 0.2s ease, transform 0.2s ease", "&:hover": { boxShadow: "0 8px 24px rgba(15,23,42,0.12)", transform: "translateY(-2px)" } }}
                      onClick={() => navigate(toShopUrl(shop))}
                    >
                      <Box onMouseEnter={() => prefetchShopDetail(shop._id)} onFocus={() => prefetchShopDetail(shop._id)} onTouchStart={() => prefetchShopDetail(shop._id)}>
                        <Box
                          sx={{
                            position: "relative",
                            height: 110,
                            background: shop.bannerUrl
                              ? `url(${shop.bannerUrl}) center/cover no-repeat`
                              : `linear-gradient(135deg, ${alpha(palette.accent, 0.45)} 0%, ${alpha("#0b1220", 0.92)} 100%)`
                          }}
                        >
                          <Box
                            sx={{
                              position: "absolute",
                              inset: 0,
                              background: "linear-gradient(180deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.62) 100%)"
                            }}
                          />
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1.2}
                            sx={{ position: "absolute", left: 14, right: 14, bottom: 12 }}
                          >
                            <Avatar src={shop.logoUrl || undefined} sx={{ width: 38, height: 38, border: "2px solid #fff" }} />
                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                sx={{
                                  color: "#fff",
                                  fontSize: 17,
                                  fontWeight: 800,
                                  lineHeight: 1.05,
                                  textShadow: "0 2px 8px rgba(0,0,0,0.45)",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis"
                                }}
                              >
                                {shop.name}
                              </Typography>
                              <Typography
                                sx={{
                                  color: "rgba(255,255,255,0.92)",
                                  fontSize: 12,
                                  textShadow: "0 1px 5px rgba(0,0,0,0.4)",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis"
                                }}
                              >
                                {shop.tagline || "Digital storefront"}
                              </Typography>
                              {shop.semanticScore && (
                                <Stack direction="row" spacing={0.4} alignItems="center" sx={{ mt: 0.3 }}>
                                  <AutoAwesomeIcon sx={{ color: palette.accent, fontSize: 10 }} />
                                  <Typography sx={{ color: "rgba(255,255,255,0.9)", fontSize: 10, fontWeight: 700 }}>
                                    {Math.round(shop.semanticScore * 100)}% Match
                                  </Typography>
                                </Stack>
                              )}
                            </Box>
                          </Stack>
                        </Box>

                        <Box sx={{ p: 1.2 }}>
                          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.2}>
                            <Stack direction="row" spacing={0.8} flexWrap="wrap">
                              <Chip
                                icon={<StorefrontIcon />}
                                label={`${Number(shop.publicProductsCount || 0).toLocaleString()} public products`}
                                size="small"
                                sx={{ bgcolor: alpha(palette.accent, 0.18), color: palette.ink, fontWeight: 700, fontSize: 12 }}
                              />
                              <Chip
                                icon={<PlaceOutlinedIcon sx={{ fontSize: 16 }} />}
                                label={market.name || "No market"}
                                variant="outlined"
                                size="small"
                                sx={{ color: palette.ink, borderColor: palette.line, fontWeight: 600, fontSize: 12 }}
                              />
                            </Stack>
                            <Stack direction="row" spacing={0.6} alignItems="center">
                              {shop.websiteUrl ? (
                                <IconButton component="a" href={toHref(shop.websiteUrl)} target="_blank" rel="noreferrer" size="small" onClick={(event) => event.stopPropagation()} sx={{ bgcolor: alpha("#2563eb", 0.14), color: "#2563eb", "&:hover": { bgcolor: alpha("#2563eb", 0.22) } }}>
                                  <LanguageIcon fontSize="small" />
                                </IconButton>
                              ) : null}
                              {shop.instagramUrl ? (
                                <IconButton component="a" href={toHref(shop.instagramUrl)} target="_blank" rel="noreferrer" size="small" onClick={(event) => event.stopPropagation()} sx={{ bgcolor: alpha("#e1306c", 0.14), color: "#e1306c", "&:hover": { bgcolor: alpha("#e1306c", 0.22) } }}>
                                  <InstagramIcon fontSize="small" />
                                </IconButton>
                              ) : null}
                              {shop.facebookUrl ? (
                                <IconButton component="a" href={toHref(shop.facebookUrl)} target="_blank" rel="noreferrer" size="small" onClick={(event) => event.stopPropagation()} sx={{ bgcolor: alpha("#1877f2", 0.14), color: "#1877f2", "&:hover": { bgcolor: alpha("#1877f2", 0.22) } }}>
                                  <FacebookIcon fontSize="small" />
                                </IconButton>
                              ) : null}
                            </Stack>
                          </Stack>

                          <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 0.5, md: 1.6 }} sx={{ mt: 1.2 }}>
                            <Stack direction="row" spacing={0.7} alignItems="center" sx={{ minWidth: 0 }}>
                              <PlaceOutlinedIcon sx={{ color: palette.accent, fontSize: 18 }} />
                              <Typography sx={{ color: palette.muted, fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {[shop.city, shop.state, shop.country].filter(Boolean).join(", ") || "Location unavailable"}
                              </Typography>
                            </Stack>
                            <Stack direction="row" spacing={0.7} alignItems="center" sx={{ minWidth: 0 }}>
                              <PhoneIcon sx={{ color: palette.accent, fontSize: 18 }} />
                              <Typography sx={{ color: palette.ink, fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {shop.contactPhone || "Contact unavailable"}
                              </Typography>
                            </Stack>
                            {shop.contactName ? (
                              <Stack direction="row" spacing={0.7} alignItems="center" sx={{ minWidth: 0 }}>
                                <PersonOutlineIcon sx={{ color: palette.accent, fontSize: 18 }} />
                                <Typography sx={{ color: palette.muted, fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {shop.contactName}
                                </Typography>
                              </Stack>
                            ) : null}
                          </Stack>

                          {shop.address ? (
                            <Typography
                              sx={{
                                mt: 0.9,
                                color: palette.muted,
                                fontSize: 12.5,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden"
                              }}
                            >
                              {shop.address}
                            </Typography>
                          ) : null}

                          <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ mt: 1 }}>
                            <Typography sx={{ color: palette.ink, fontWeight: 700, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 0.3 }}>
                              Open shop <ArrowForwardRoundedIcon sx={{ fontSize: 15 }} />
                            </Typography>
                          </Stack>
                        </Box>
                      </Box>
                    </Card>
                  );
                })}
              </Stack>
            ) : resultType === "markets" ? (
              <Stack spacing={1.8}>
                {items.map((market: any) => (
                  <Card key={market._id} sx={{ borderRadius: 1, border: `1px solid ${palette.line}`, transition: "box-shadow 0.2s ease, transform 0.2s ease", "&:hover": { boxShadow: "0 8px 24px rgba(15,23,42,0.12)", transform: "translateY(-2px)" } }}>
                    <Box sx={{ p: 1.8 }}>
                      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.5}>
                        <Box>
                          <Typography sx={{ fontSize: 18, lineHeight: 1.1, fontWeight: 800, color: palette.ink }}>
                            {market.name}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                            <PlaceOutlinedIcon sx={{ color: palette.accent, fontSize: 18 }} />
                            <Typography sx={{ color: palette.muted, fontSize: 13 }}>
                              {[market.city, market.state, market.country].filter(Boolean).join(", ") || "Location not available"}
                            </Typography>
                          </Stack>
                        </Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => navigate(toMarketUrl(market))}
                          >
                            Open Market
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => {
                              setMarketId(String(market._id));
                              setResultType("products");
                              setPage(1);
                            }}
                          >
                            Search Products
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setMarketId(String(market._id));
                              setResultType("shops");
                              setPage(1);
                            }}
                          >
                            Browse Shops
                          </Button>
                        </Stack>
                      </Stack>
                    </Box>
                  </Card>
                ))}
              </Stack>
            ) : viewMode === "list" ? (
              <Stack spacing={1.8}>
                {items.map((product: any) => {
                  const business = product.businessId || {};
                  const market = business.marketId || {};
                  return (
                    <Card
                      key={product._id}
                      sx={{ borderRadius: 1, border: `1px solid ${palette.line}`, cursor: "pointer", transition: "box-shadow 0.2s ease, transform 0.2s ease", "&:hover": { boxShadow: "0 8px 24px rgba(15,23,42,0.12)", transform: "translateY(-2px)" } }}
                      onClick={() => navigate(toProductUrl(product))}
                      onMouseEnter={() => prefetchProductDetail(product._id)}
                      onFocus={() => prefetchProductDetail(product._id)}
                      onTouchStart={() => prefetchProductDetail(product._id)}
                    >
                      <Grid container>
                        <Grid item xs={12} sm={3.5}>
                          <Box
                            component="img"
                            src={product.thumbnailUrl || "/Invonta.png"}
                            alt={product.name}
                            sx={{ width: "100%", height: { xs: 180, sm: 170 }, objectFit: "cover", display: "block" }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={8.5}>
                          <Box sx={{ p: 1.5 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                              <Box>
                                <Typography sx={{ fontSize: 18, lineHeight: 1, fontWeight: 800, color: palette.ink }}>
                                  Rs {Number(product.salePrice || 0).toLocaleString()}
                                </Typography>
                                <Typography sx={{ mt: 0.5, fontSize: 15, fontWeight: 600, color: palette.ink }}>
                                  {product.name}
                                </Typography>
                              </Box>
                              <IconButton onClick={(event) => event.stopPropagation()}>
                                <FavoriteBorderIcon />
                              </IconButton>
                            </Stack>
                            {product.semanticScore && (
                              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.2 }}>
                                <AutoAwesomeIcon sx={{ color: palette.accent, fontSize: 13 }} />
                                <Typography sx={{ color: palette.accent, fontSize: 12, fontWeight: 800 }}>
                                  {Math.round(product.semanticScore * 100)}% AI Match
                                </Typography>
                              </Stack>
                            )}
                            <Typography sx={{ mt: 0.5, color: palette.muted, fontSize: 12.5 }}>
                              SKU: {product.sku || "-"} {product.category ? `- ${product.category}` : ""}
                            </Typography>
                            <Typography sx={{ mt: 0.8, color: palette.muted, fontSize: 12.5 }}>
                              {business.address || "Shop address not available"} - {market.name || "Market"} - {business.name || "Shop"}
                            </Typography>
                            <Typography sx={{ mt: 0.6, color: palette.ink, fontWeight: 700, fontSize: 13 }}>
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
                {items.map((product: any) => {
                  const business = product.businessId || {};
                  const market = business.marketId || {};
                  return (
                    <Grid key={product._id} item xs={12} sm={6} md={4}>
                      <Card
                        sx={{ borderRadius: 1, border: `1px solid ${palette.line}`, height: "100%", cursor: "pointer", transition: "box-shadow 0.2s ease, transform 0.2s ease", "&:hover": { boxShadow: "0 8px 24px rgba(15,23,42,0.12)", transform: "translateY(-2px)" } }}
                        onClick={() => navigate(toProductUrl(product))}
                        onMouseEnter={() => prefetchProductDetail(product._id)}
                        onFocus={() => prefetchProductDetail(product._id)}
                        onTouchStart={() => prefetchProductDetail(product._id)}
                      >
                        <Box
                          component="img"
                          src={product.thumbnailUrl || "/Invonta.png"}
                          alt={product.name}
                          sx={{ width: "100%", height: 170, objectFit: "cover", display: "block" }}
                        />
                        <Box sx={{ p: 1.2 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Typography sx={{ fontSize: 16, lineHeight: 1, fontWeight: 800, color: palette.ink }}>
                              Rs {Number(product.salePrice || 0).toLocaleString()}
                            </Typography>
                            <IconButton size="small" onClick={(event) => event.stopPropagation()}>
                              <FavoriteBorderIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                          {product.semanticScore && (
                            <Stack direction="row" spacing={0.4} alignItems="center" sx={{ mt: 0.2, mb: 0.2 }}>
                              <AutoAwesomeIcon sx={{ color: palette.accent, fontSize: 11 }} />
                              <Typography sx={{ color: palette.accent, fontSize: 11, fontWeight: 800 }}>
                                {Math.round(product.semanticScore * 100)}% AI Match
                              </Typography>
                            </Stack>
                          )}
                          <Typography sx={{ mt: 0.5, fontSize: 14, fontWeight: 600, color: palette.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {product.name}
                          </Typography>
                          <Typography sx={{ mt: 0.4, color: palette.muted, fontSize: 11.5 }}>
                            SKU: {product.sku || "-"} {product.category ? `- ${product.category}` : ""}
                          </Typography>
                          <Typography sx={{ mt: 0.6, color: palette.muted, fontSize: 11.5 }}>
                            {market.name || "Market"} - {business.name || "Shop"}
                          </Typography>
                          <Typography sx={{ mt: 0.4, color: palette.ink, fontWeight: 700, fontSize: 12 }}>
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
      <PublicFooter />
    </Box>
  );
}
