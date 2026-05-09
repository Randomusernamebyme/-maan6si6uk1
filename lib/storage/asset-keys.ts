const defaultPrefix = "maan6si6uk1";

/** Storage 內物件鍵前綴（路徑最上層資料夾） */
export function storageAssetPrefix(): string {
  const raw =
    process.env.NEXT_PUBLIC_STORAGE_ASSET_PREFIX?.trim() || process.env.STORAGE_ASSET_PREFIX?.trim();
  if (!raw) return defaultPrefix;
  return raw.replace(/^\/+|\/+$/g, "");
}

/** 例如 maan6si6uk1/branding/header-logo */
export function brandingLogoPublicId(): string {
  return process.env.STORAGE_OBJECT_KEY_LOGO?.trim() || `${storageAssetPrefix()}/branding/header-logo`;
}

export function brandingHeroPublicId(): string {
  return process.env.STORAGE_OBJECT_KEY_HERO?.trim() || `${storageAssetPrefix()}/branding/hover`;
}

export function serviceFieldPublicId(id: string): string {
  const override = process.env[`STORAGE_OBJECT_KEY_SERVICE_FIELD_${id}`]?.trim();
  if (override) return override;
  return `${storageAssetPrefix()}/service-fields/${id}`;
}
