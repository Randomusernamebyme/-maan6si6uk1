/**
 * 圖片託管：優先使用 Supabase Storage（與 Cloudinary 擇一或漸進遷移）。
 * 讀取網址只需 NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET。
 * 上傳另需 SUPABASE_SERVICE_ROLE_KEY。
 */

export function isSupabaseStorageReadConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET?.trim()
  );
}

export function isSupabaseStorageUploadConfigured(): boolean {
  return isSupabaseStorageReadConfigured() && !!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
}
