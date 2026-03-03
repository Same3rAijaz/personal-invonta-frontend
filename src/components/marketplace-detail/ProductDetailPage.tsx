import React from "react";
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import {
  CheckCircleOutline as CheckCircleOutlineIcon,
  Language as LanguageIcon,
  LocalPhoneOutlined as LocalPhoneOutlinedIcon,
  PlaceOutlined as PlaceOutlinedIcon,
  EmailOutlined as EmailOutlinedIcon,
  PersonOutline as PersonOutlineIcon,
  WhatsApp as WhatsAppIcon,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  StorefrontOutlined as StorefrontOutlinedIcon
} from "@mui/icons-material";
import { alpha, useTheme } from "@mui/material/styles";
import MarketplaceHeader from "./MarketplaceHeader";
import Breadcrumbs from "./Breadcrumbs";
import type { ProductDetailViewModel } from "./types";

type MarketOption = { _id: string; name: string };

type ProductDetailPageProps = {
  model: ProductDetailViewModel;
  isLoading?: boolean;
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
    isLoading = false,
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
  const [imageIndex, setImageIndex] = React.useState(0);
  const [activeTab, setActiveTab] = React.useState<"description" | "specs" | "reviews">("description");
  const gallery = model.gallery?.length ? model.gallery : [{ id: "fallback", url: "/Invonta.png", alt: model.title }];
  const activeImage = gallery[Math.min(imageIndex, gallery.length - 1)];
  const descriptionLines = (model.description || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const originalPrice = Math.round(Number(model.price || 0) * 1.1);
  const toHref = (value?: string) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    return `https://${raw}`;
  };

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
        <Container maxWidth="xl" sx={{ py: 1 }}>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            {model.categoryLinks.map((item) => (
              <Button key={item.label} href={item.href || "#"} sx={{ minWidth: 0, p: 0, color: theme.palette.text.secondary }}>
                {item.label}
              </Button>
            ))}
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 2.5 } }}>
        <Breadcrumbs items={model.breadcrumbs} />

        {isLoading ? (
          <Box
            sx={{
              minHeight: 420,
              border: `1px solid ${alpha(theme.palette.text.primary, 0.14)}`,
              borderRadius: 2,
              bgcolor: theme.palette.background.paper,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              px: 3
            }}
          >
            <Typography color="text.secondary">Loading product...</Typography>
          </Box>
        ) : (
          <Grid container spacing={2} alignItems="flex-start">
            <Grid item xs={12} lg={8.6}>
              <Paper sx={{ borderRadius: 1.4, overflow: "hidden", border: `1px solid ${alpha(theme.palette.text.primary, 0.12)}` }}>
                <Grid container>
                  <Grid item xs={12} md={4.4}>
                    <Box sx={{ p: 1.2, borderRight: { md: `1px solid ${alpha(theme.palette.text.primary, 0.08)}` } }}>
                      <Box
                        sx={{
                          borderRadius: 1.2,
                          overflow: "hidden",
                          border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
                          bgcolor: "#f3f5f9"
                        }}
                      >
                        <Box component="img" src={activeImage.url} alt={activeImage.alt || model.title} sx={{ width: "100%", height: { xs: 260, md: 390 }, objectFit: "contain", display: "block" }} />
                      </Box>
                      <Stack direction="row" spacing={0.8} sx={{ mt: 1 }}>
                        {gallery.slice(0, 4).map((img, idx) => (
                          <Box
                            key={img.id}
                            onClick={() => setImageIndex(idx)}
                            sx={{
                              width: 62,
                              height: 62,
                              p: 0.3,
                              borderRadius: 0.8,
                              overflow: "hidden",
                              border: `1px solid ${idx === imageIndex ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.16)}`,
                              cursor: "pointer",
                              bgcolor: "#fff"
                            }}
                          >
                            <Box component="img" src={img.url} alt={img.alt || `image-${idx + 1}`} sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={7.6}>
                    <Box sx={{ p: 1.6 }}>
                      <Typography sx={{ fontSize: { xs: 28, md: 42 }, lineHeight: 1.1, fontWeight: 800, color: theme.palette.text.primary }}>
                        {model.title}
                      </Typography>
                      <Divider sx={{ my: 1.2 }} />

                      <Stack spacing={0.5}>
                        {model.details.slice(0, 3).map((item) => (
                          <Typography key={item.label} sx={{ color: theme.palette.text.secondary, fontSize: 14 }}>
                            • {item.label}: {item.value}
                          </Typography>
                        ))}
                      </Stack>

                      <Divider sx={{ my: 1.2 }} />

                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.9 }}>
                        <Chip label="SALE" size="small" sx={{ bgcolor: alpha(theme.palette.error.main, 0.15), color: theme.palette.error.main, fontWeight: 700 }} />
                        <Typography sx={{ color: theme.palette.text.secondary, textDecoration: "line-through", fontSize: 20 }}>
                          Rs {originalPrice.toLocaleString()}
                        </Typography>
                        <Typography sx={{ color: theme.palette.text.primary, fontWeight: 800, fontSize: 40 }}>
                          Rs {Number(model.price || 0).toLocaleString()}
                        </Typography>
                      </Stack>

                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.1 }}>
                        <CheckCircleOutlineIcon sx={{ color: theme.palette.success.main, fontSize: 18 }} />
                        <Typography sx={{ color: theme.palette.success.dark, fontSize: 14, fontWeight: 600 }}>
                          Support: Earn marketplace points
                        </Typography>
                      </Stack>
                    </Box>
                  </Grid>
                </Grid>

                <Divider />
                <Stack direction="row" spacing={0.8} sx={{ p: 1 }}>
                  <Button variant={activeTab === "description" ? "contained" : "text"} size="small" onClick={() => setActiveTab("description")} sx={{ textTransform: "none" }}>
                    Description
                  </Button>
                  <Button variant={activeTab === "specs" ? "contained" : "text"} size="small" onClick={() => setActiveTab("specs")} sx={{ textTransform: "none" }}>
                    Specifications
                  </Button>
                  <Button variant={activeTab === "reviews" ? "contained" : "text"} size="small" onClick={() => setActiveTab("reviews")} sx={{ textTransform: "none" }}>
                    Reviews
                  </Button>
                </Stack>
              </Paper>

              <Paper sx={{ mt: 1.8, p: 1.6, borderRadius: 1.4, border: `1px solid ${alpha(theme.palette.text.primary, 0.12)}` }}>
                {activeTab === "description" ? (
                  <Stack spacing={0.7}>
                    <Typography sx={{ color: theme.palette.text.primary, fontSize: 30, fontWeight: 800 }}>
                      Description
                    </Typography>
                    {(descriptionLines.length ? descriptionLines : ["No description provided"]).map((line) => (
                      <Typography key={line} sx={{ color: theme.palette.text.secondary, fontSize: 15 }}>
                        {line}
                      </Typography>
                    ))}
                  </Stack>
                ) : null}
                {activeTab === "specs" ? (
                  <Grid container spacing={1}>
                    {model.details.map((item) => (
                      <Grid key={item.label} item xs={12} sm={6}>
                        <Paper variant="outlined" sx={{ p: 1.1, borderRadius: 1 }}>
                          <Typography sx={{ color: theme.palette.text.secondary, fontSize: 12 }}>{item.label}</Typography>
                          <Typography sx={{ color: theme.palette.text.primary, fontWeight: 700, fontSize: 15 }}>{item.value}</Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                ) : null}
                {activeTab === "reviews" ? (
                  <Stack spacing={1}>
                    <Typography sx={{ color: theme.palette.text.primary, fontWeight: 700, fontSize: 20 }}>Customer Reviews</Typography>
                    <Typography sx={{ color: theme.palette.text.secondary, fontSize: 14 }}>
                      Reviews are available on shop profile. Visit seller profile to submit review.
                    </Typography>
                    <Button variant="outlined" onClick={onOpenSellerProfile} sx={{ alignSelf: "flex-start" }}>
                      Open Seller Profile
                    </Button>
                  </Stack>
                ) : null}
              </Paper>

              <Paper sx={{ mt: 1.8, p: 1.6, borderRadius: 1.4, border: `1px solid ${alpha(theme.palette.text.primary, 0.12)}` }}>
                <Typography sx={{ fontSize: 32, fontWeight: 800, mb: 1.2, color: theme.palette.text.primary }}>
                  Related Products You May Like
                </Typography>
                {model.relatedProducts.length === 0 ? (
                  <Typography sx={{ color: theme.palette.text.secondary }}>No related products found.</Typography>
                ) : (
                  <Grid container spacing={1.2}>
                    {model.relatedProducts.map((item) => (
                      <Grid key={item.id} item xs={12} sm={6} md={4}>
                        <Paper
                          onClick={() => onOpenRelatedProduct(item.id)}
                          sx={{ borderRadius: 1, overflow: "hidden", cursor: "pointer", border: `1px solid ${alpha(theme.palette.text.primary, 0.12)}` }}
                        >
                          <Box component="img" src={item.imageUrl || "/Invonta.png"} alt={item.title} sx={{ width: "100%", height: 140, objectFit: "cover", display: "block" }} />
                          <Box sx={{ p: 1 }}>
                            <Typography sx={{ color: theme.palette.text.primary, fontWeight: 700, fontSize: 14 }} noWrap>
                              {item.title}
                            </Typography>
                            <Typography sx={{ color: theme.palette.text.primary, fontWeight: 800, fontSize: 20 }}>
                              Rs {Number(item.price || 0).toLocaleString()}
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} lg={3.4}>
              <Stack spacing={1.5}>
                <Paper sx={{ p: 1.3, borderRadius: 1.4, border: `1px solid ${alpha(theme.palette.text.primary, 0.12)}` }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box component="img" src="/Invonta.png" alt="shop" sx={{ width: 38, height: 38 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: 18, fontWeight: 800, color: theme.palette.text.primary }}>{model.seller.name}</Typography>
                      <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>{model.locationText}</Typography>
                    </Box>
                  </Stack>
                </Paper>

                <Paper sx={{ p: 1.3, borderRadius: 1.4, border: `1px solid ${alpha(theme.palette.text.primary, 0.12)}` }}>
                  <Typography sx={{ fontSize: 18, fontWeight: 800, color: theme.palette.text.primary, mb: 0.7 }}>
                    Business & Admin Details
                  </Typography>
                  <Stack spacing={0.8}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PersonOutlineIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                      <Typography sx={{ fontSize: 14, color: theme.palette.text.secondary }}>
                        {model.seller.adminName || "Business Admin"}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <EmailOutlinedIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                      <Typography sx={{ fontSize: 14, color: theme.palette.text.secondary }}>
                        {model.seller.adminEmail || "Email not available"}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <LocalPhoneOutlinedIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                      <Typography sx={{ fontSize: 14, color: theme.palette.text.secondary }}>{model.seller.phone || "Phone not available"}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PlaceOutlinedIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                      <Typography sx={{ fontSize: 14, color: theme.palette.text.secondary }}>{model.seller.address || model.locationText}</Typography>
                    </Stack>
                    {model.seller.market ? (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <StorefrontOutlinedIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                        <Typography sx={{ fontSize: 14, color: theme.palette.text.secondary }}>{model.seller.market}</Typography>
                      </Stack>
                    ) : null}
                  </Stack>
                  <Divider sx={{ my: 1 }} />
                  <Stack direction="row" spacing={1} alignItems="center">
                    {model.seller.websiteUrl ? (
                      <IconButton component="a" href={toHref(model.seller.websiteUrl)} target="_blank" rel="noreferrer" size="small" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.12), color: "#2563eb", "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.2) } }}>
                        <LanguageIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    ) : null}
                    {model.seller.instagramUrl ? (
                      <IconButton component="a" href={toHref(model.seller.instagramUrl)} target="_blank" rel="noreferrer" size="small" sx={{ bgcolor: alpha("#e1306c", 0.14), color: "#e1306c", "&:hover": { bgcolor: alpha("#e1306c", 0.24) } }}>
                        <InstagramIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    ) : null}
                    {model.seller.facebookUrl ? (
                      <IconButton component="a" href={toHref(model.seller.facebookUrl)} target="_blank" rel="noreferrer" size="small" sx={{ bgcolor: alpha("#1877f2", 0.14), color: "#1877f2", "&:hover": { bgcolor: alpha("#1877f2", 0.24) } }}>
                        <FacebookIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    ) : null}
                    {model.seller.whatsapp ? (
                      <IconButton component="a" href={`https://wa.me/${String(model.seller.whatsapp).replace(/\D/g, "")}`} target="_blank" rel="noreferrer" size="small" sx={{ bgcolor: alpha("#25d366", 0.14), color: "#25d366", "&:hover": { bgcolor: alpha("#25d366", 0.24) } }}>
                        <WhatsAppIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    ) : null}
                    {!model.seller.websiteUrl && !model.seller.instagramUrl && !model.seller.facebookUrl && !model.seller.whatsapp ? (
                      <Typography sx={{ fontSize: 13, color: theme.palette.text.secondary }}>No social links added</Typography>
                    ) : null}
                  </Stack>
                </Paper>

              </Stack>
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
}

