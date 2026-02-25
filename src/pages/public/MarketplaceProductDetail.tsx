import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import ProductDetailPage from "../../components/marketplace-detail/ProductDetailPage";
import type { ProductDetailViewModel } from "../../components/marketplace-detail/types";
import { getPublicProductDetail, listPublicMarkets } from "../../api/public";

function formatTimeAgo(input?: string) {
  if (!input) return "Recently posted";
  const created = new Date(input).getTime();
  if (Number.isNaN(created)) return "Recently posted";
  const diffMs = Date.now() - created;
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}

const mockModel: ProductDetailViewModel = {
  id: "mock-samsung-watch-7",
  title: "samsung watch 7 44 mm",
  price: 42000,
  locationText: "Dera Adda, Multan",
  postedText: "30 minutes ago",
  categoryLinks: [
    { label: "All Categories", href: "/marketplace" },
    { label: "Mobiles", href: "/marketplace" },
    { label: "Smart Watches", href: "/marketplace" }
  ],
  breadcrumbs: [
    { label: "Home", href: "/marketplace" },
    { label: "Mobiles", href: "/marketplace" },
    { label: "Smart Watches", href: "/marketplace" },
    { label: "Samsung watch 7" }
  ],
  gallery: [
    { id: "g1", url: "/Invonta.png", alt: "Samsung watch image 1" },
    { id: "g2", url: "/Invonta.png", alt: "Samsung watch image 2" },
    { id: "g3", url: "/Invonta.png", alt: "Samsung watch image 3" },
    { id: "g4", url: "/Invonta.png", alt: "Samsung watch image 4" }
  ],
  isFeatured: true,
  details: [
    { label: "Brand", value: "Samsung" },
    { label: "Condition", value: "Used" },
    { label: "Model", value: "Watch 7" },
    { label: "Size", value: "44 mm" }
  ],
  description: "samsung watch 7\n44 mm\nlike a brand new\ngreen colour\ngenuine charger",
  seller: {
    id: "mock-seller-anas",
    name: "Anas",
    market: "Dera Adda, Multan",
    address: "Dera Adda, Multan",
    phone: "+92 300 0000000",
    memberSince: "2023",
    activeAds: 2,
    adId: "111647016"
  },
  relatedProducts: [
    { id: "r1", title: "Apple watch Series 5 44mm", price: 43000, imageUrl: "/Invonta.png", location: "Shalimar Colony, Multan", timeAgo: "57 minutes ago" },
    { id: "r2", title: "smart watch pro5", price: 35000, imageUrl: "/Invonta.png", location: "Qasim Bela, Multan", timeAgo: "1 day ago" },
    { id: "r3", title: "Samsung Gear S3 frontier", price: 32000, imageUrl: "/Invonta.png", location: "MDA Road, Multan", timeAgo: "1 day ago" }
  ],
  safetyTips: [
    "Only meet in public / crowded places.",
    "Never go alone to meet buyer/seller.",
    "Check and inspect the product before purchasing it.",
    "Never pay / transfer money in advance before inspection."
  ]
};

function mapApiToViewModel(id: string, data: any): ProductDetailViewModel {
  const product = data?.product || {};
  const related = data?.related || [];
  const business = product?.businessId || {};
  const market = business?.marketId || {};

  const details = [
    { label: "Brand", value: product?.category || "N/A" },
    { label: "Condition", value: product?.isActive ? "Available" : "Unavailable" },
    { label: "Barcode", value: product?.barcode || "N/A" },
    { label: "Unit", value: product?.unit || "N/A" }
  ];

  return {
    id: product?._id || id,
    title: product?.name || "Product",
    price: Number(product?.salePrice || 0),
    locationText: [business?.city, business?.address].filter(Boolean).join(", ") || "Location not available",
    postedText: formatTimeAgo(product?.createdAt),
    categoryLinks: [
      { label: "All Categories", href: "/marketplace" },
      { label: product?.category || "Category", href: "/marketplace" }
    ],
    breadcrumbs: [
      { label: "Home", href: "/marketplace" },
      { label: product?.category || "Category", href: "/marketplace" },
      { label: product?.name || "Product" }
    ],
    gallery: (product?.images?.length ? product.images : [product?.thumbnailUrl || "/Invonta.png", "/Invonta.png", "/Invonta.png", "/Invonta.png"]).map((url: string, index: number) => ({
      id: `img-${index}`,
      url: url || "/Invonta.png",
      alt: product?.name || "Product image"
    })),
    isFeatured: true,
    details,
    description: product?.description || "No description provided.",
    seller: {
      id: business?._id,
      name: business?.name || "Seller",
      market: market?.name || "",
      address: business?.address || "",
      phone: business?.contactPhone || "",
      memberSince: business?.createdAt ? String(new Date(business.createdAt).getFullYear()) : undefined,
      activeAds: undefined,
      adId: product?._id
    },
    relatedProducts: related.map((item: any) => ({
      id: item?._id,
      title: item?.name || "Related product",
      price: Number(item?.salePrice || 0),
      imageUrl: item?.thumbnailUrl || "/Invonta.png",
      location: [item?.businessId?.city, item?.businessId?.name].filter(Boolean).join(", "),
      timeAgo: formatTimeAgo(item?.createdAt)
    })),
    safetyTips: mockModel.safetyTips
  };
}

export default function MarketplaceProductDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = React.useState("");
  const [marketId, setMarketId] = React.useState("");

  const { data: marketData = [] } = useQuery({
    queryKey: ["public-markets-detail"],
    queryFn: () => listPublicMarkets()
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-product-detail", id],
    queryFn: () => getPublicProductDetail(id),
    enabled: Boolean(id),
    placeholderData: (previousData) => previousData
  });

  const model = React.useMemo(() => {
    if (!data || isError) return mockModel;
    return mapApiToViewModel(id, data);
  }, [data, id, isError]);

  return (
    <ProductDetailPage
      model={model}
      isLoading={isLoading && !data}
      markets={marketData || []}
      selectedMarketId={marketId}
      searchValue={search}
      onMarketChange={setMarketId}
      onSearchChange={setSearch}
      onSearchSubmit={() => navigate(`/marketplace?search=${encodeURIComponent(search)}${marketId ? `&marketId=${marketId}` : ""}`)}
      onBack={() => navigate("/marketplace")}
      onOpenSellerProfile={() => model.seller.id ? navigate(`/marketplace/shops/${model.seller.id}`) : undefined}
      onOpenRelatedProduct={(productId) => navigate(`/marketplace/${productId}`)}
    />
  );
}

