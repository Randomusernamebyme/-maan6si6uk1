import { cloudinaryImageDeliveryUrl } from "@/lib/cloudinary/delivery";
import { isSupabaseStorageReadConfigured } from "@/lib/storage/provider";

/**
 * 依 asset path（與 lib/cloudinary/public-ids 相同慣例）回傳可公開讀取的圖片 URL。
 * 若已設定 Supabase，優先走 Storage public bucket；否則回退 Cloudinary。
 */
export function imageAssetDeliveryUrl(assetPath: string): string | null {
  const trimmed = String(assetPath || "").trim();
  if (!trimmed) return null;

  if (isSupabaseStorageReadConfigured()) {
    const supabaseUrl = (
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
    ).trim().replace(/\/+$/, "");
    const bucket = (process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "").trim();
    const path = trimmed.replace(/^\/+/, "");
    const segments = path.split("/").map((s) => encodeURIComponent(s));
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${segments.join("/")}`;
  }

  return cloudinaryImageDeliveryUrl(trimmed);
}
