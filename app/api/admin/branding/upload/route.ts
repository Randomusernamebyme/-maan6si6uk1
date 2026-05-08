import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { brandingHeroPublicId, brandingLogoPublicId, serviceFieldPublicId } from "@/lib/cloudinary/public-ids";
import { uploadImageBufferToPublicId } from "@/lib/cloudinary/upload";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split("Bearer ")[1];
  try {
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(token);
    const adminDb = getAdminDb();
    const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      return null;
    }
    return decodedToken;
  } catch {
    return null;
  }
}

type BrandingAssetKey = "logo" | "hero" | "character1" | "character2" | "character3";

function resolvePublicId(asset: BrandingAssetKey): string {
  if (asset === "logo") return brandingLogoPublicId();
  if (asset === "hero") return brandingHeroPublicId();
  if (asset === "character1") return serviceFieldPublicId("1");
  if (asset === "character2") return serviceFieldPublicId("2");
  return serviceFieldPublicId("3");
}

export async function POST(request: NextRequest) {
  try {
    const decoded = await verifyAdmin(request);
    if (!decoded) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const formData = await request.formData();
    const asset = String(formData.get("asset") || "").trim() as BrandingAssetKey;
    const file = formData.get("file");
    if (!asset || !(file instanceof File)) {
      return NextResponse.json({ error: "缺少 asset 或檔案" }, { status: 400 });
    }
    if (!["logo", "hero", "character1", "character2", "character3"].includes(asset)) {
      return NextResponse.json({ error: "asset 不正確" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const contentType = file.type || "image/png";

    const publicId = resolvePublicId(asset);
    const { secureUrl, publicId: uploadedPublicId } = await uploadImageBufferToPublicId(
      buffer,
      contentType,
      publicId
    );

    return NextResponse.json({
      asset,
      publicId: uploadedPublicId,
      url: secureUrl,
      uploadedAt: new Date().toISOString(),
      uploadedBy: decoded.uid,
    });
  } catch (error: any) {
    console.error("Error uploading branding image:", error);
    return NextResponse.json({ error: error.message || "上傳失敗" }, { status: 500 });
  }
}

