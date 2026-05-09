/** Supabase Storage 公開物件 URL（public bucket） */
export function supabasePublicObjectUrl(objectKey: string): string | null {
  const baseRaw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET?.trim();
  if (!baseRaw || !bucket) return null;

  const base = baseRaw.replace(/\/+$/, "");
  const key = objectKey.trim().replace(/^\/+/, "");
  if (!key) return null;

  const encodedKey = key
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${base}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodedKey}`;
}

/** 附加查詢參數以略過 CDN／瀏覽器對同一公開 URL 的快取（值每次上傳後更新即可） */
export function supabasePublicObjectUrlWithBust(objectKey: string, bust: string | null): string | null {
  const baseUrl = supabasePublicObjectUrl(objectKey);
  if (!baseUrl || !bust) return baseUrl;
  const sep = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${sep}bust=${encodeURIComponent(bust)}`;
}
