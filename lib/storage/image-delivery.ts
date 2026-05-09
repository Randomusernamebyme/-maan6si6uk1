import { supabasePublicObjectUrl } from "@/lib/storage/supabase-public-url";

/** 依物件鍵回傳 Supabase 公開讀取 URL；未設定環境變數時回傳 null */
export function imageAssetDeliveryUrl(objectKey: string): string | null {
  return supabasePublicObjectUrl(objectKey);
}
