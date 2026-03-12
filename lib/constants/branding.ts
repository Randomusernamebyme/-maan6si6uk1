export const HEADER_BRANDING = {
  title: "堅城萬事屋",
  // 使用後端簽名網址代理，避免 Firebase Storage 403 導致前端 502
  logoUrl: "/api/branding/logo",
  width: 180,
  height: 48,
} as const;

export const HERO_BRANDING = {
  title: "堅城萬事屋",
  // 對應：gs://maan6si6uk1.firebasestorage.app/branding/hover.png
  heroUrl: "/api/branding/hero",
  width: 1920,
  height: 540,
} as const;

