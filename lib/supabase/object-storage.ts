import { getSupabaseServiceRoleClient } from "@/lib/supabase/admin-client";

function requireBucket(): string {
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET?.trim();
  if (!bucket) {
    throw new Error("Supabase Storage 未設定：需要 NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET");
  }
  return bucket;
}

export async function uploadPublicObject(
  objectPath: string,
  buffer: Buffer,
  contentType: string,
  options?: { upsert?: boolean }
): Promise<{ publicUrl: string; path: string }> {
  const bucket = requireBucket();
  const path = String(objectPath || "")
    .trim()
    .replace(/^\/+/, "");
  if (!path) {
    throw new Error("缺少 Supabase object path");
  }
  const client = getSupabaseServiceRoleClient();
  const { error } = await client.storage.from(bucket).upload(path, buffer, {
    contentType: contentType || "application/octet-stream",
    upsert: options?.upsert ?? false,
  });
  if (error) {
    throw new Error(`Supabase 上傳失敗：${error.message}`);
  }
  const { data } = client.storage.from(bucket).getPublicUrl(path);
  return { publicUrl: data.publicUrl, path };
}
