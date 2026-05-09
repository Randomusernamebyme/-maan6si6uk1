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
