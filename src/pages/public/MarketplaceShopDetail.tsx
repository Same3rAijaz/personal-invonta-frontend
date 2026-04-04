import React from "react";
import { Avatar, Box, Button, Card, Chip, Container, Divider, Grid, IconButton, MenuItem, Pagination, Paper, Rating, Stack, Typography } from "@mui/material";
import TextField from "../../components/CustomTextField";;
import { alpha } from "@mui/material/styles";
import { keyframes } from "@mui/system";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";

const aiGlow = keyframes`
  0% {
    filter: drop-shadow(0 0 2px rgba(33, 166, 223, 0.4));
    transform: scale(1);
  }
  50% {
    filter: drop-shadow(0 0 8px rgba(33, 166, 223, 0.8));
    transform: scale(1.1);
  }
  100% {
    filter: drop-shadow(0 0 2px rgba(33, 166, 223, 0.4));
    transform: scale(1);
  }
`;
import StorefrontIcon from "@mui/icons-material/Storefront";
import PlaceIcon from "@mui/icons-material/Place";
import PhoneIcon from "@mui/icons-material/Phone";
import SearchIcon from "@mui/icons-material/Search";
import VerifiedIcon from "@mui/icons-material/Verified";
import LanguageIcon from "@mui/icons-material/Language";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getPublicProductDetail, 
  getPublicShopDetail, 
  getPublicShopDetailBySlug, 
  listPublicMarkets, 
  listPublicShopReviews, 
  listPublicShopReviewsBySlug, 
  upsertPublicShopReview, 
  upsertPublicShopReviewBySlug, 
  semanticSearchPublicProducts
} from "../../api/public";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { Switch, FormControlLabel } from "@mui/material";
import { useToast } from "../../hooks/useToast";
import { useFavorites } from "../../hooks/useFavorites";
import { useMarketplaceAuth } from "../../hooks/useMarketplaceAuth";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { extractEntityId, toProductUrl } from "../../utils/seo";
import MarketplaceHeader from "../../components/marketplace-detail/MarketplaceHeader";
import PublicFooter from "../../components/marketplace-detail/PublicFooter";

const LIMIT = 12;

type ShopTab = "products" | "about" | "reviews";

export default function MarketplaceShopDetail() {
  const params = useParams();
  const shopSlug = React.useMemo(() => String(params.shopSlug || params.seo || "").trim(), [params.shopSlug, params.seo]);
  const legacyId = React.useMemo(() => extractEntityId(params.seo || params.id || ""), [params.seo, params.id]);
  const isLegacyIdRoute = React.useMemo(() => /^[a-fA-F0-9]{24}(?:-.+)?$/.test(String(params.seo || params.id || "")), [params.seo, params.id]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const marketplaceAuth = useMarketplaceAuth();
  const { isFavorited, toggle } = useFavorites();
  const palette = {
    canvas: "#d7dce4",
    ink: "#0b1220",
    muted: "#51607a",
    accent: "#21a6df",
    line: alpha("#0b1220", 0.14)
  };

  const [page, setPage] = React.useState(1);
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [topSearch, setTopSearch] = React.useState("");
  const [marketId, setMarketId] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [sort, setSort] = React.useState<"newest" | "price_asc" | "price_desc" | "name_asc">("newest");
  const [activeTab, setActiveTab] = React.useState<ShopTab>("products");
  const [reviewRating, setReviewRating] = React.useState<number | null>(0);
  const [reviewComment, setReviewComment] = React.useState("");
  const [semanticMode, setSemanticMode] = React.useState(true);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["public-shop-detail", shopSlug, legacyId, page, search, category, sort, semanticMode],
    queryFn: async () => {
      if (semanticMode && search.trim() && shop?._id) {
        const result = await semanticSearchPublicProducts({
          query: search,
          page,
          limit: LIMIT,
          businessId: String(shop._id),
          category: category || undefined
        });
        // We need to fetch the shop detail separately or merge it because semanticSearchPublicProducts only returns items
        // But getPublicShopDetail returns more info. To keep it simple, we'll fetch shop detail always and override items if semantic
        const base = isLegacyIdRoute ? await getPublicShopDetail(legacyId) : await getPublicShopDetailBySlug(shopSlug);
        return {
          ...base,
          inventory: {
            items: result.items,
            total: result.total
          }
        };
      }
      return isLegacyIdRoute
        ? getPublicShopDetail(legacyId, {
            page,
            limit: LIMIT,
            search: search || undefined,
            category: category || undefined,
            sort
          })
        : getPublicShopDetailBySlug(shopSlug, {
            page,
            limit: LIMIT,
            search: search || undefined,
            category: category || undefined,
            sort
          });
    },
    enabled: Boolean(shopSlug || legacyId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData
  });

  const { data: reviewData, isFetching: isReviewFetching } = useQuery({
    queryKey: ["public-shop-reviews", shopSlug, legacyId],
    queryFn: () => (isLegacyIdRoute ? listPublicShopReviews(legacyId, { page: 1, limit: 20 }) : listPublicShopReviewsBySlug(shopSlug, { page: 1, limit: 20 })),
    enabled: Boolean((shopSlug || legacyId) && activeTab === "reviews"),
    staleTime: 2 * 60 * 1000 // 2 minutes
  });

  const reviewMutation = useMutation({
    mutationFn: (payload: { rating: number; comment?: string }) => (isLegacyIdRoute ? upsertPublicShopReview(legacyId, payload) : upsertPublicShopReviewBySlug(shopSlug, payload)),
    onSuccess: () => {
      notify("Review submitted", "success");
      setReviewComment("");
      queryClient.invalidateQueries({ queryKey: ["public-shop-reviews", shopSlug, legacyId] });
    },
    onError: (err: any) => {
      notify(err?.response?.data?.error?.message || "Unable to submit review", "error");
    }
  });

  const { data: marketData = [] } = useQuery({
    queryKey: ["public-markets-shop-detail"],
    queryFn: () => listPublicMarkets(),
    staleTime: 30 * 60 * 1000 // 30 mins
  });

  const shop = data?.shop;
  const market = shop?.marketId || {};
  const inventory = data?.inventory?.items || [];
  const total = data?.inventory?.total || 0;
  const pages = Math.max(1, Math.ceil(total / LIMIT));
  const categories = data?.categories || [];
  const reviewStats = reviewData?.stats;
  const reviews = reviewData?.items || [];

  React.useEffect(() => {
    const canonical = data?.shop?.shopSlug ? `/${data.shop.shopSlug}` : "";
    const isPrefixedUrl = window.location.pathname.startsWith("/marketplace/");
    if (canonical && (isLegacyIdRoute || isPrefixedUrl) && canonical !== window.location.pathname) {
      navigate(canonical, { replace: true });
    }
  }, [data?.shop?.shopSlug, isLegacyIdRoute, navigate]);

  const prefetchProductDetail = React.useCallback(
    (productId?: string) => {
      if (!productId) return;
      queryClient.prefetchQuery({
        queryKey: ["public-product-detail", productId],
        queryFn: () => getPublicProductDetail(productId),
        staleTime: 60 * 1000
      });
    },
    [queryClient]
  );

  const handleSubmitReview = () => {
    if (!marketplaceAuth.isAuthenticated) {
      notify("Sign in with Google to submit a review", "warning");
      return;
    }
    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      notify("Please choose a rating between 1 and 5", "warning");
      return;
    }
    reviewMutation.mutate({ rating: reviewRating, comment: reviewComment.trim() || undefined });
  };

  const toHref = (value?: string) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    return `https://${raw}`;
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: palette.canvas }}>
      <MarketplaceHeader
        markets={marketData}
        selectedMarketId={marketId}
        onMarketChange={setMarketId}
        search={topSearch}
        onSearchChange={setTopSearch}
        onSearchSubmit={() => navigate(`/marketplace?search=${encodeURIComponent(topSearch)}${marketId ? `&marketId=${marketId}` : ""}&semantic=true`)}
        semanticMode={semanticMode}
        onSemanticModeChange={setSemanticMode}
      />

      <Container maxWidth="xl" sx={{ py: 2.2 }}>
        {isLoading && !data ? (
          <Paper sx={{ p: 3, borderRadius: 1.5 }}>
            <Typography color="text.secondary">Loading shop...</Typography>
          </Paper>
        ) : !shop ? (
          <Paper sx={{ p: 3, borderRadius: 1.5 }}>
            <Typography variant="h6" sx={{ color: palette.ink, fontWeight: 700 }}>Shop not found</Typography>
          </Paper>
        ) : (
          <Stack spacing={1.8}>
            <Grid container spacing={1.8} alignItems="flex-start">
              <Grid item xs={12} md={8.5}>
                <Paper sx={{ borderRadius: 1.5, overflow: "hidden" }}>
                  <Box sx={{ position: "relative", minHeight: 205, bgcolor: alpha(palette.ink, 0.08) }}>
                    {shop.bannerUrl ? (
                      <Box component="img" src={shop.bannerUrl} sx={{ width: "100%", height: 205, objectFit: "cover", display: "block" }} />
                    ) : null}
                    <Stack direction="row" spacing={1.2} alignItems="flex-end" sx={{ position: "absolute", left: 12, bottom: 10 }}>
                      <Avatar src={shop.logoUrl || undefined} sx={{ width: 62, height: 62, border: "2px solid #fff" }} />
                      <Box>
                        <Typography sx={{ color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.5)", fontSize: 26, fontWeight: 800, lineHeight: 1.1 }}>
                          {shop.name}
                        </Typography>
                        <Typography sx={{ color: "#fff", textShadow: "0 1px 6px rgba(0,0,0,0.45)", fontSize: 13 }}>
                          {shop.tagline || "Digital storefront"}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>

                  <Box sx={{ p: 1 }}>
                    <Stack direction="row" spacing={0.8}>
                      {(["products", "about", "reviews"] as ShopTab[]).map((tab) => (
                        <Button
                          key={tab}
                          size="small"
                          variant={activeTab === tab ? "contained" : "text"}
                          onClick={() => setActiveTab(tab)}
                          sx={{ textTransform: "none", fontWeight: activeTab === tab ? 700 : 600 }}
                        >
                          {tab === "products" ? "Products" : tab === "about" ? "About" : "Reviews"}
                        </Button>
                      ))}
                    </Stack>
                  </Box>
                </Paper>

                {activeTab === "products" ? (
                  <>
                    <Paper sx={{ borderRadius: 1.5, p: 1.4, mt: 1.5 }}>
                      <Grid container spacing={1}>
                        <Grid item xs={12} md={5}>
                          <TextField
                            size="small"
                            fullWidth
                            placeholder={semanticMode ? `Ask AI to find in ${shop.name || "shop"}...` : `Search in ${shop.name || "shop"}...`}
                            value={searchInput}
                            onChange={(event) => {
                              setSearchInput(event.target.value);
                            }}
                            InputProps={{ 
                              startAdornment: (
                                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mr: 1, borderRight: `1px solid ${alpha(palette.line, 0.5)}`, pr: 1 }}>
                                  <AutoAwesomeIcon 
                                    sx={{ 
                                      fontSize: 18, 
                                      color: palette.accent, 
                                      ml: 1,
                                      animation: searchInput.trim().length > 0 ? `${aiGlow} 2s infinite ease-in-out` : 'none'
                                    }} 
                                  />
                                  <Box sx={{ display: { xs: "none", sm: "block" } }}>
                                  </Box>
                                </Stack>
                              )
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} md={3.5}>
                          <TextField
                            size="small"
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
                              <MenuItem key={item} value={item} sx={{ fontSize: 13 }}>
                                {item}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid item xs={12} md={3.5}>
                          <TextField
                            size="small"
                            select
                            fullWidth
                            label="Sort by"
                            value={sort}
                            onChange={(event) => {
                              setSort(event.target.value as any);
                              setPage(1);
                            }}
                          >
                            <MenuItem value="newest" sx={{ fontSize: 13 }}>Most relevant</MenuItem>
                            <MenuItem value="name_asc" sx={{ fontSize: 13 }}>Name A-Z</MenuItem>
                            <MenuItem value="price_asc" sx={{ fontSize: 13 }}>Price low to high</MenuItem>
                            <MenuItem value="price_desc" sx={{ fontSize: 13 }}>Price high to low</MenuItem>
                          </TextField>
                        </Grid>
                      </Grid>
                    </Paper>

                    <Grid container spacing={1.5} sx={{ mt: 0.2 }}>
                      <Grid item xs={12} md={4}>
                        <Paper sx={{ borderRadius: 1.5, p: 1.6, height: "100%" }}>
                          <Typography sx={{ color: palette.ink, fontWeight: 800, fontSize: 16, mb: 0.7 }}>About Us</Typography>
                          <Typography sx={{ color: palette.muted, fontSize: 13, mb: 1.1 }}>
                            {shop.description || "This shop is available on Invonta marketplace with public products and direct contact details."}
                          </Typography>
                          <Divider sx={{ my: 1 }} />
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography sx={{ color: palette.muted, fontSize: 13 }}>
                              {shop.marketplaceVisible === false ? "Hidden on marketplace" : "Live on marketplace"}
                            </Typography>
                            <Chip size="small" label="Open now" sx={{ width: "fit-content", bgcolor: alpha("#22c55e", 0.16), color: "#166534", fontWeight: 700 }} />
                          </Stack>
                          <Stack spacing={0.8}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <StorefrontIcon fontSize="small" sx={{ color: palette.accent, fontSize: 18 }} />
                              <Typography sx={{ color: palette.muted, fontSize: 13 }}>{market?.name || "Market not set"}</Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <PlaceIcon fontSize="small" sx={{ color: palette.accent, fontSize: 18 }} />
                              <Typography sx={{ color: palette.muted, fontSize: 13 }}>{shop.address || "Address not available"}</Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <PhoneIcon fontSize="small" sx={{ color: palette.accent, fontSize: 18 }} />
                              <Typography sx={{ color: palette.ink, fontWeight: 700, fontSize: 13 }}>{shop.contactPhone || "Phone not available"}</Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <LanguageIcon fontSize="small" sx={{ color: palette.accent, fontSize: 18 }} />
                              <Typography sx={{ color: palette.muted, fontSize: 13 }}>Business Socials</Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                              {shop.websiteUrl ? (
                                <IconButton component="a" href={toHref(shop.websiteUrl)} target="_blank" rel="noreferrer" size="small" sx={{ bgcolor: alpha("#2563eb", 0.14), color: "#2563eb", "&:hover": { bgcolor: alpha("#2563eb", 0.24) } }}>
                                  <LanguageIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              ) : null}
                              {shop.instagramUrl ? (
                                <IconButton component="a" href={toHref(shop.instagramUrl)} target="_blank" rel="noreferrer" size="small" sx={{ bgcolor: alpha("#e1306c", 0.14), color: "#e1306c", "&:hover": { bgcolor: alpha("#e1306c", 0.24) } }}>
                                  <InstagramIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              ) : null}
                              {shop.facebookUrl ? (
                                <IconButton component="a" href={toHref(shop.facebookUrl)} target="_blank" rel="noreferrer" size="small" sx={{ bgcolor: alpha("#1877f2", 0.14), color: "#1877f2", "&:hover": { bgcolor: alpha("#1877f2", 0.24) } }}>
                                  <FacebookIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              ) : null}
                              {!shop.websiteUrl && !shop.instagramUrl && !shop.facebookUrl ? (
                                <Typography sx={{ color: palette.muted, fontSize: 13 }}>No social links added</Typography>
                              ) : null}
                            </Stack>
                          </Stack>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={8}>
                        {isFetching ? (
                          <Typography sx={{ color: palette.muted, fontSize: 12, mb: 1 }}>Updating results...</Typography>
                        ) : null}
                        {inventory.length === 0 ? (
                          <Paper sx={{ p: 2, borderRadius: 1.5 }}>
                            <Typography sx={{ color: palette.ink, fontWeight: 700 }}>No public products found</Typography>
                          </Paper>
                        ) : (
                          <Grid container spacing={1.3}>
                            {inventory.map((item: any) => (
                              <Grid item xs={12} sm={6} key={item._id}>
                                <Card
                                  onClick={() => navigate(toProductUrl(item))}
                                  onMouseEnter={() => prefetchProductDetail(item._id)}
                                  onFocus={() => prefetchProductDetail(item._id)}
                                  onTouchStart={() => prefetchProductDetail(item._id)}
                                  sx={{ borderRadius: 1.2, border: `1px solid ${palette.line}`, cursor: "pointer" }}
                                >
                                  <Box component="img" src={item.thumbnailUrl || "/Invonta.png"} alt={item.name} sx={{ width: "100%", height: 150, objectFit: "cover", display: "block" }} />
                                  <Box sx={{ p: 1.1, position: "relative" }}>
                                     <IconButton
                                       size="small"
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         toggle(item._id);
                                       }}
                                       sx={{ position: "absolute", top: -35, right: 5, bgcolor: "rgba(255,255,255,0.8)", "&:hover": { bgcolor: "#fff" } }}
                                     >
                                       {isFavorited(item._id) ? (
                                         <FavoriteIcon fontSize="small" sx={{ color: "#ef4444" }} />
                                       ) : (
                                         <FavoriteBorderIcon fontSize="small" sx={{ color: "#ef4444" }} />
                                       )}
                                     </IconButton>
                                    <Typography sx={{ color: palette.ink, fontWeight: 700, fontSize: 14 }} noWrap>
                                      {item.name}
                                    </Typography>
                                    <Typography sx={{ color: palette.muted, fontSize: 12, mb: 0.3 }} noWrap>
                                      {item.category || "Category not set"}
                                    </Typography>
                                    <Typography sx={{ color: palette.ink, fontWeight: 800, fontSize: 18 }}>
                                      Rs {Number(item.salePrice || 0).toLocaleString()}
                                    </Typography>
                                    {item.semanticScore && (
                                      <Stack direction="row" spacing={0.4} alignItems="center" sx={{ mt: 0.3 }}>
                                        <AutoAwesomeIcon sx={{ color: palette.accent, fontSize: 11 }} />
                                        <Typography sx={{ color: palette.accent, fontSize: 11, fontWeight: 800 }}>
                                          {Math.round(item.semanticScore * 100)}% Match
                                        </Typography>
                                      </Stack>
                                    )}
                                  </Box>
                                </Card>
                              </Grid>
                            ))}
                          </Grid>
                        )}
                        {pages > 1 ? (
                          <Stack direction="row" justifyContent="center" sx={{ mt: 1.8 }}>
                            <Pagination size="small" count={pages} page={page} onChange={(_, value) => setPage(value)} />
                          </Stack>
                        ) : null}
                      </Grid>
                    </Grid>
                  </>
                ) : null}

                {activeTab === "about" ? (
                  <Paper sx={{ borderRadius: 1.5, p: 2, mt: 1.5 }}>
                    <Typography sx={{ color: palette.ink, fontWeight: 800, fontSize: 18, mb: 0.8 }}>About {shop.name}</Typography>
                    <Typography sx={{ color: palette.muted, fontSize: 14, mb: 1.5 }}>
                      {shop.description || "No detailed description provided by the shop owner yet."}
                    </Typography>
                    <Grid container spacing={1.2}>
                      <Grid item xs={12} md={6}>
                        <Typography sx={{ color: palette.ink, fontWeight: 700, fontSize: 14 }}>Marketplace Status</Typography>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.3 }}>
                          <Typography sx={{ color: palette.muted, fontSize: 14 }}>
                            {shop.marketplaceVisible === false ? "Hidden on marketplace" : "Live on marketplace"}
                          </Typography>
                          <Chip size="small" label="Open now" sx={{ width: "fit-content", bgcolor: alpha("#22c55e", 0.16), color: "#166534", fontWeight: 700 }} />
                        </Stack>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography sx={{ color: palette.ink, fontWeight: 700, fontSize: 14 }}>Market</Typography>
                        <Typography sx={{ color: palette.muted, fontSize: 14 }}>{market?.name || "Not set"}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography sx={{ color: palette.ink, fontWeight: 700, fontSize: 14 }}>Address</Typography>
                        <Typography sx={{ color: palette.muted, fontSize: 14 }}>{shop.address || "Not set"}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography sx={{ color: palette.ink, fontWeight: 700, fontSize: 14 }}>Phone</Typography>
                        <Typography sx={{ color: palette.ink, fontSize: 14, fontWeight: 700 }}>{shop.contactPhone || "Not set"}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography sx={{ color: palette.ink, fontWeight: 700, fontSize: 14 }}>Support Email</Typography>
                        <Typography sx={{ color: palette.muted, fontSize: 14 }}>{shop.supportEmail || "Not set"}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography sx={{ color: palette.ink, fontWeight: 700, fontSize: 14 }}>WhatsApp</Typography>
                        <Typography sx={{ color: palette.muted, fontSize: 14 }}>{shop.whatsappNumber || "Not set"}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography sx={{ color: palette.ink, fontWeight: 700, fontSize: 14 }}>Website</Typography>
                        {shop.websiteUrl ? (
                          <IconButton component="a" href={toHref(shop.websiteUrl)} target="_blank" rel="noreferrer" size="small" sx={{ bgcolor: alpha("#2563eb", 0.14), color: "#2563eb", "&:hover": { bgcolor: alpha("#2563eb", 0.24) } }}>
                            <LanguageIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        ) : (
                          <Typography sx={{ color: palette.muted, fontSize: 14 }}>Not set</Typography>
                        )}
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography sx={{ color: palette.ink, fontWeight: 700, fontSize: 14 }}>Instagram</Typography>
                        {shop.instagramUrl ? (
                          <IconButton component="a" href={toHref(shop.instagramUrl)} target="_blank" rel="noreferrer" size="small" sx={{ bgcolor: alpha("#e1306c", 0.14), color: "#e1306c", "&:hover": { bgcolor: alpha("#e1306c", 0.24) } }}>
                            <InstagramIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        ) : (
                          <Typography sx={{ color: palette.muted, fontSize: 14 }}>Not set</Typography>
                        )}
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography sx={{ color: palette.ink, fontWeight: 700, fontSize: 14 }}>Facebook</Typography>
                        {shop.facebookUrl ? (
                          <IconButton component="a" href={toHref(shop.facebookUrl)} target="_blank" rel="noreferrer" size="small" sx={{ bgcolor: alpha("#1877f2", 0.14), color: "#1877f2", "&:hover": { bgcolor: alpha("#1877f2", 0.24) } }}>
                            <FacebookIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        ) : (
                          <Typography sx={{ color: palette.muted, fontSize: 14 }}>Not set</Typography>
                        )}
                      </Grid>
                    </Grid>
                  </Paper>
                ) : null}

                {activeTab === "reviews" ? (
                  <Paper sx={{ borderRadius: 1.5, p: 2, mt: 1.5 }}>
                    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.2}>
                      <Box>
                        <Typography sx={{ color: palette.ink, fontWeight: 800, fontSize: 18 }}>Customer Reviews</Typography>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.3 }}>
                          <Rating value={Number(reviewStats?.averageRating || 0)} precision={0.1} readOnly size="small" />
                          <Typography sx={{ color: palette.muted, fontSize: 13 }}>
                            {Number(reviewStats?.averageRating || 0).toFixed(1)} ({Number(reviewStats?.totalReviews || 0)} reviews)
                          </Typography>
                        </Stack>
                      </Box>
                    </Stack>
                    <Divider sx={{ my: 1.4 }} />

                    <Stack spacing={1}>
                      <Typography sx={{ color: palette.ink, fontWeight: 700, fontSize: 14 }}>Write a review</Typography>
                      <Rating value={reviewRating} onChange={(_, value) => setReviewRating(value)} />
                      <TextField
                        multiline
                        minRows={3}
                        placeholder="Share your experience with this shop..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        inputProps={{ maxLength: 1000 }}
                      />
                      {!marketplaceAuth.isAuthenticated ? (
                        <Typography sx={{ color: palette.muted, fontSize: 12 }}>
                          Sign in with Google to submit a review.
                        </Typography>
                      ) : null}
                      <Box>
                        <Button variant="contained" onClick={handleSubmitReview} disabled={reviewMutation.isPending}>
                          {reviewMutation.isPending ? "Submitting..." : "Submit review"}
                        </Button>
                      </Box>
                    </Stack>

                    <Divider sx={{ my: 1.4 }} />
                    {isReviewFetching ? (
                      <Typography sx={{ color: palette.muted, fontSize: 13 }}>Loading reviews...</Typography>
                    ) : reviews.length === 0 ? (
                      <Typography sx={{ color: palette.muted, fontSize: 13 }}>No reviews yet.</Typography>
                    ) : (
                      <Stack spacing={1.2}>
                        {reviews.map((item: any) => (
                          <Paper key={item._id} variant="outlined" sx={{ p: 1.2, borderRadius: 1 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography sx={{ color: palette.ink, fontWeight: 700, fontSize: 13 }}>
                                {item.reviewer?.fullName || "Anonymous"}
                              </Typography>
                              <Rating readOnly size="small" value={Number(item.rating || 0)} />
                            </Stack>
                            <Typography sx={{ color: palette.muted, fontSize: 12, mt: 0.4 }}>
                              {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
                            </Typography>
                            <Typography sx={{ color: palette.ink, fontSize: 13, mt: 0.5 }}>
                              {item.comment || "No comment"}
                            </Typography>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </Paper>
                ) : null}

              </Grid>

              <Grid item xs={12} md={3.5}>
                <Stack spacing={1.5}>
                  <Paper sx={{ borderRadius: 1.5, p: 1.6 }}>
                    <Typography sx={{ color: palette.ink, fontWeight: 800, fontSize: 18, mb: 0.8 }}>
                      Business Owner Profile
                    </Typography>
                    <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.1 }}>
                      <Avatar src={shop.profileImageUrl || undefined} sx={{ width: 52, height: 52 }} />
                      <Box>
                        <Typography sx={{ color: palette.ink, fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
                          {shop.contactName || "Business Owner"}
                        </Typography>
                        <Typography sx={{ color: palette.muted, fontSize: 12 }}>Owner & Manager</Typography>
                      </Box>
                    </Stack>
                    <Chip icon={<VerifiedIcon sx={{ fontSize: 16 }} />} label="Verified Business Owner" sx={{ mb: 1, bgcolor: alpha("#22c55e", 0.14), color: "#166534", fontWeight: 700 }} />
                    <Stack spacing={0.7}>
                      <Typography sx={{ color: palette.muted, fontSize: 13, wordBreak: "break-all" }}>
                        {shop.supportEmail || "Email not available"}
                      </Typography>
                      <Typography sx={{ color: palette.ink, fontWeight: 700, fontSize: 13 }}>
                        {shop.contactPhone || "Phone not available"}
                      </Typography>
                      <Typography sx={{ color: palette.muted, fontSize: 13 }}>
                        {[shop.city, shop.state].filter(Boolean).join(", ") || "Location not set"}
                      </Typography>
                    </Stack>
                  </Paper>

                  <Paper sx={{ borderRadius: 1.5, p: 1.6 }}>
                    <Typography sx={{ color: palette.ink, fontWeight: 800, fontSize: 18, mb: 0.8 }}>
                      Categories
                    </Typography>
                    <Stack spacing={0.3}>
                      {categories.length === 0 ? (
                        <Typography sx={{ color: palette.muted, fontSize: 13 }}>No categories available</Typography>
                      ) : (
                        categories.map((item: string) => (
                          <Button
                            key={item}
                            size="small"
                            onClick={() => {
                              setCategory(item);
                              setPage(1);
                              setActiveTab("products");
                            }}
                            sx={{ justifyContent: "flex-start", color: palette.ink, textTransform: "none" }}
                          >
                            {item}
                          </Button>
                        ))
                      )}
                    </Stack>
                  </Paper>
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        )}
      </Container>
      <PublicFooter />
    </Box>
  );
}
