import crypto from "crypto";

function getUploadCloudName(): string | undefined {
  return process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
}

/** Cloudinary v1 API 簽名（SHA1），見官方 authentication signatures 說明 */
function signUploadParams(params: Record<string, string | number>, apiSecret: string): string {
  const stringToSign = Object.keys(params)
    .filter((k) => !["file", "cloud_name", "resource_type", "signature"].includes(k))
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHash("sha1").update(stringToSign + apiSecret).digest("hex");
}

export async function uploadGalleryBuffer(
  buffer: Buffer,
  contentType: string,
  requestId: string
): Promise<{ secureUrl: string; publicId: string }> {
  const cloudName = getUploadCloudName();
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary 上傳設定不完整：需要 CLOUDINARY_CLOUD_NAME（或 NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME）、CLOUDINARY_API_KEY、CLOUDINARY_API_SECRET"
    );
  }

  const prefix = process.env.CLOUDINARY_ASSET_PREFIX?.trim().replace(/^\/+|\/+$/g, "") || "maan6si6uk1";
  const folder = `${prefix}/requests/${requestId}/gallery`;
  const timestamp = Math.round(Date.now() / 1000);

  const signPayload: Record<string, string | number> = { folder, timestamp };
  const signature = signUploadParams(signPayload, apiSecret);

  const form = new FormData();
  const bytes = new Uint8Array(buffer);
  form.append("file", new Blob([bytes], { type: contentType || "image/jpeg" }), "upload");
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("folder", folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`Cloudinary 上傳失敗（${res.status}）：${raw.slice(0, 500)}`);
  }

  let data: { secure_url?: string; public_id?: string };
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("Cloudinary 回應不是有效 JSON");
  }

  if (!data.secure_url) {
    throw new Error("Cloudinary 回應缺少 secure_url");
  }

  return { secureUrl: data.secure_url, publicId: data.public_id || "" };
}
