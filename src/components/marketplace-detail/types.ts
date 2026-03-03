export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export type GalleryImage = {
  id: string;
  url: string;
  alt?: string;
};

export type DetailItem = {
  label: string;
  value: string;
};

export type SellerInfo = {
  id?: string;
  shopSlug?: string;
  name: string;
  adminName?: string;
  adminEmail?: string;
  market?: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  memberSince?: string;
  activeAds?: number;
  adId?: string;
  avatarUrl?: string;
};

export type RelatedProduct = {
  id: string;
  title: string;
  price: number;
  imageUrl?: string;
  location?: string;
  timeAgo?: string;
};

export type ProductDetailViewModel = {
  id: string;
  title: string;
  price: number;
  locationText: string;
  postedText: string;
  categoryLinks: BreadcrumbItem[];
  breadcrumbs: BreadcrumbItem[];
  gallery: GalleryImage[];
  isFeatured?: boolean;
  details: DetailItem[];
  description: string;
  seller: SellerInfo;
  relatedProducts: RelatedProduct[];
  safetyTips: string[];
};

