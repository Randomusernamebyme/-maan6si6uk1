export const HEADER_BRANDING = {
  title: "堅城萬事屋",
  // 使用後端簽名網址代理，避免 Firebase Storage 403 導致前端 502
  logoUrl: "/api/branding/logo",
  hoverLogoUrl: "/api/branding/hover",
  width: 180,
  height: 48,
} as const;

