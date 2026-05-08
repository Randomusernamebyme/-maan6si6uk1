import { randomUUID } from "crypto";
import { uploadGalleryBuffer, uploadGalleryBufferToFolder, uploadImageBufferToPublicId } from "@/lib/cloudinary/upload";
import { uploadPublicObject } from "@/lib/supabase/object-storage";
import { isSupabaseStorageUploadConfigured } from "@/lib/storage/provider";

function extFromContentType(contentType: string): string {
  const ct = (contentType || "").toLowerCase();
  if (ct.includes("png")) return "png";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("gif")) return "gif";
  if (ct.includes("svg")) return "svg";
  return "jpg";
}

export async function uploadGalleryBufferUnified(
  buffer: Buffer,
  contentType: string,
  requestId: string
): Promise<{ secureUrl: string; publicId: string }> {
  if (!isSupabaseStorageUploadConfigured()) {
    return uploadGalleryBuffer(buffer, contentType, requestId);
  }
  const prefix =
    process.env.CLOUDINARY_ASSET_PREFIX?.trim().replace(/^\/+|\/+$/g, "") || "maan6si6uk1";
  const ext = extFromContentType(contentType);
  const objectPath = `${prefix}/requests/${requestId}/gallery/${randomUUID()}.${ext}`;
  const { publicUrl, path } = await uploadPublicObject(objectPath, buffer, contentType, {
    upsert: false,
  });
  return { secureUrl: publicUrl, publicId: path };
}

export async function uploadGalleryBufferToFolderUnified(
  buffer: Buffer,
  contentType: string,
  folderSuffix: string
): Promise<{ secureUrl: string; publicId: string }> {
  if (!isSupabaseStorageUploadConfigured()) {
    return uploadGalleryBufferToFolder(buffer, contentType, folderSuffix);
  }
  const prefix =
    process.env.CLOUDINARY_ASSET_PREFIX?.trim().replace(/^\/+|\/+$/g, "") || "maan6si6uk1";
  const safeSuffix = String(folderSuffix || "").trim().replace(/^\/+|\/+$/g, "");
  const ext = extFromContentType(contentType);
  const objectPath = `${prefix}/${safeSuffix}/${randomUUID()}.${ext}`;
  const { publicUrl, path } = await uploadPublicObject(objectPath, buffer, contentType, {
    upsert: false,
  });
  return { secureUrl: publicUrl, publicId: path };
}

export async function uploadBrandingByAssetPathUnified(
  buffer: Buffer,
  contentType: string,
  assetPath: string
): Promise<{ secureUrl: string; publicId: string }> {
  const pathKey = String(assetPath || "").trim().replace(/^\/+/, "");
  if (!pathKey) {
    throw new Error("缺少 asset path");
  }
  if (!isSupabaseStorageUploadConfigured()) {
    return uploadImageBufferToPublicId(buffer, contentType, pathKey);
  }
  const { publicUrl, path } = await uploadPublicObject(pathKey, buffer, contentType, {
    upsert: true,
  });
  return { secureUrl: publicUrl, publicId: path };
}
