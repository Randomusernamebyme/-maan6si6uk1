export const HEADER_BRANDING = {
  title: "堅城萬事屋",
  // 經 API 302 導向圖片託管（Supabase Storage 或 Cloudinary，見 lib/storage/image-delivery）
  logoUrl: "/api/branding/logo",
  width: 180,
  height: 48,
} as const;

export const HERO_BRANDING = {
  title: "堅城萬事屋",
  // 預設 asset path：{CLOUDINARY_ASSET_PREFIX}/branding/hover（同上，可為 Supabase 物件鍵）
  heroUrl: "/api/branding/hero",
  width: 1920,
  height: 540,
} as const;

