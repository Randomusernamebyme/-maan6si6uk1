export const HEADER_BRANDING = {
  title: "堅城萬事屋",
  // 經 API 302 導向 Supabase Storage 公開物件（見 lib/storage/image-delivery）
  logoUrl: "/api/branding/logo",
  width: 180,
  height: 48,
} as const;

export const HERO_BRANDING = {
  title: "堅城萬事屋",
  // 預設物件鍵：{NEXT_PUBLIC_STORAGE_ASSET_PREFIX}/branding/hover
  heroUrl: "/api/branding/hero",
  width: 1920,
  height: 540,
} as const;

