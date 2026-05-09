import { randomBytes } from "crypto";
import { getSupabaseServiceRole } from "@/lib/supabase/admin-client";
import { storageAssetPrefix } from "@/lib/storage/asset-keys";
import { supabasePublicObjectUrl } from "@/lib/storage/supabase-public-url";

function requireBucket(): string {
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET?.trim();
  if (!bucket) {
    throw new Error("NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET 未設定");
  }
  return bucket;
}

function extFromContentType(contentType: string): string {
  const c = (contentType || "").toLowerCase();
  if (c.includes("png")) return "png";
  if (c.includes("webp")) return "webp";
  if (c.includes("gif")) return "gif";
  if (c.includes("svg")) return "svg";
  if (c.includes("jpeg") || c.includes("jpg")) return "jpg";
  return "jpg";
}

async function uploadBufferToObjectKey(
  buffer: Buffer,
  contentType: string,
  objectKey: string,
  options: { upsert: boolean }
): Promise<{ secureUrl: string; publicId: string }> {
  const supabase = getSupabaseServiceRole();
  const bucket = requireBucket();
  const key = objectKey.replace(/^\/+/, "");

  const { error } = await supabase.storage.from(bucket).upload(key, buffer, {
    contentType: contentType || "application/octet-stream",
    upsert: options.upsert,
  });

  if (error) {
    throw new Error(error.message || "Supabase Storage 上傳失敗");
  }

  const secureUrl = supabasePublicObjectUrl(key);
  if (!secureUrl) {
    throw new Error("無法組出公開 URL：請確認 NEXT_PUBLIC_SUPABASE_URL 與 NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET");
  }

  return { secureUrl, publicId: key };
}

export async function uploadGalleryBufferUnified(
  buffer: Buffer,
  contentType: string,
  requestId: string
): Promise<{ secureUrl: string; publicId: string }> {
  const prefix = storageAssetPrefix();
  const safeRequest = String(requestId || "").trim().replace(/^\/+|\/+$/g, "");
  if (!safeRequest) {
    throw new Error("缺少 requestId");
  }
  const ext = extFromContentType(contentType);
  const name = `${randomBytes(12).toString("hex")}.${ext}`;
  const objectKey = `${prefix}/requests/${safeRequest}/gallery/${name}`;
  return uploadBufferToObjectKey(buffer, contentType, objectKey, { upsert: false });
}

export async function uploadGalleryBufferToFolderUnified(
  buffer: Buffer,
  contentType: string,
  folderSuffix: string
): Promise<{ secureUrl: string; publicId: string }> {
  const prefix = storageAssetPrefix();
  const safeSuffix = String(folderSuffix || "").trim().replace(/^\/+|\/+$/g, "");
  if (!safeSuffix) {
    throw new Error("缺少上傳資料夾路徑");
  }
  const ext = extFromContentType(contentType);
  const name = `${randomBytes(12).toString("hex")}.${ext}`;
  const objectKey = `${prefix}/${safeSuffix}/${name}`;
  return uploadBufferToObjectKey(buffer, contentType, objectKey, { upsert: false });
}

/** 覆寫既有物件鍵（branding 等固定檔名）；先刪再寫以避免 upsert 快取仍回舊檔 */
export async function uploadBrandingBufferToObjectKey(
  buffer: Buffer,
  contentType: string,
  objectKey: string
): Promise<{ secureUrl: string; publicId: string }> {
  const supabase = getSupabaseServiceRole();
  const bucket = requireBucket();
  const key = objectKey.replace(/^\/+/, "");

  const { error: rmErr } = await supabase.storage.from(bucket).remove([key]);
  if (rmErr) {
    console.warn("[branding upload] remove existing object (可忽略若本來不存在):", rmErr.message);
  }

  return uploadBufferToObjectKey(buffer, contentType, key, { upsert: true });
}
