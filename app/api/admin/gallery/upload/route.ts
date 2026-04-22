import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { uploadGalleryBuffer } from "@/lib/cloudinary/upload";

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

export async function POST(request: NextRequest) {
  try {
    const decoded = await verifyAdmin(request);
    if (!decoded) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const formData = await request.formData();
    const requestId = String(formData.get("requestId") || "").trim();
    const file = formData.get("file");

    if (!requestId || !(file instanceof File)) {
      return NextResponse.json({ error: "缺少 requestId 或檔案" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const contentType = file.type || "image/jpeg";

    const { secureUrl } = await uploadGalleryBuffer(buffer, contentType, requestId);

    return NextResponse.json({
      url: secureUrl,
      uploadedAt: new Date().toISOString(),
      uploadedBy: decoded.uid,
    });
  } catch (error: any) {
    console.error("Error uploading gallery photo:", error);
    return NextResponse.json(
      { error: error.message || "上傳相片失敗" },
      { status: 500 }
    );
  }
}
