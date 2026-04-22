export const HEADER_BRANDING = {
  title: "堅城萬事屋",
  // 經 API 302 導向 Cloudinary 交付網址（見 lib/cloudinary/public-ids）
  logoUrl: "/api/branding/logo",
  width: 180,
  height: 48,
} as const;

export const HERO_BRANDING = {
  title: "堅城萬事屋",
  // Cloudinary public_id 預設：{CLOUDINARY_ASSET_PREFIX}/branding/hover
  heroUrl: "/api/branding/hero",
  width: 1920,
  height: 540,
} as const;

