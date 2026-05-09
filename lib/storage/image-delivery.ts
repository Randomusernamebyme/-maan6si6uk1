import { supabasePublicObjectUrl, supabasePublicObjectUrlWithBust } from "@/lib/storage/supabase-public-url";

/** 依物件鍵回傳 Supabase 公開讀取 URL；未設定環境變數時回傳 null */
export function imageAssetDeliveryUrl(objectKey: string, bust?: string | null): string | null {
  if (bust) return supabasePublicObjectUrlWithBust(objectKey, bust);
  return supabasePublicObjectUrl(objectKey);
}
