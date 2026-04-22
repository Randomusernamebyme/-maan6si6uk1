/**
 * Cloudinary 圖片交付網址（公開讀取，不需 API Secret）。
 * 需在 Cloudinary 控制台建立對應 public_id（預設路徑見 public-ids）。
 */
export function getCloudName(): string | undefined {
  return process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
}

export function cloudinaryImageDeliveryUrl(publicId: string): string | null {
  const cloud = getCloudName();
  if (!cloud || !publicId.trim()) return null;
  const id = publicId.replace(/^\/+/, "");
  return `https://res.cloudinary.com/${cloud}/image/upload/${id}`;
}
