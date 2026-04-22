const defaultPrefix = "maan6si6uk1";

function assetPrefix(): string {
  const raw = process.env.CLOUDINARY_ASSET_PREFIX?.trim();
  if (!raw) return defaultPrefix;
  return raw.replace(/^\/+|\/+$/g, "");
}

/** 例如 maan6si6uk1/branding/header-logo */
export function brandingLogoPublicId(): string {
  return process.env.CLOUDINARY_PUBLIC_ID_LOGO?.trim() || `${assetPrefix()}/branding/header-logo`;
}

export function brandingHeroPublicId(): string {
  return process.env.CLOUDINARY_PUBLIC_ID_HERO?.trim() || `${assetPrefix()}/branding/hover`;
}

export function serviceFieldPublicId(id: string): string {
  const override = process.env[`CLOUDINARY_PUBLIC_ID_SERVICE_FIELD_${id}`]?.trim();
  if (override) return override;
  return `${assetPrefix()}/service-fields/${id}`;
}
