export function slugifySeo(value?: string) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function extractEntityId(seoParam?: string) {
  const raw = String(seoParam || "").trim();
  const match = raw.match(/^([a-fA-F0-9]{24})(?:-.+)?$/);
  if (match) return match[1];
  return raw;
}

export function toProductUrl(product: { _id?: string; id?: string; name?: string }) {
  const id = String(product?._id || product?.id || "");
  const slug = slugifySeo(product?.name || "product");
  return `/marketplace/products/${id}${slug ? `-${slug}` : ""}`;
}

export function toShopUrl(shop: { _id?: string; id?: string; name?: string; shopSlug?: string }) {
  const slug = slugifySeo(shop?.shopSlug || shop?.name || "shop");
  return `/${slug}`;
}

export function toMarketUrl(market: { _id?: string; id?: string; name?: string }) {
  const id = String(market?._id || market?.id || "");
  const slug = slugifySeo(market?.name || "market");
  return `/marketplace/markets/${id}${slug ? `-${slug}` : ""}`;
}
