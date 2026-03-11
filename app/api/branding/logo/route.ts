import { NextRequest, NextResponse } from "next/server";
import { getStorage } from "firebase-admin/storage";
import { getAdminApp } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
      return NextResponse.json({ error: "Storage bucket 未設定" }, { status: 500 });
    }

    const bucket = getStorage(getAdminApp()).bucket(bucketName);
    const variant = request.nextUrl.searchParams.get("variant");
    const objectPath = variant === "hover" ? "branding/hover.png" : "branding/header-logo.png";
    const file = bucket.file(objectPath);

    const [exists] = await file.exists();
    if (!exists) {
      return NextResponse.json({ error: `Logo 檔案不存在：${objectPath}` }, { status: 404 });
    }

    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: "2500-01-01",
    });

    return NextResponse.redirect(signedUrl, {
      status: 302,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error: any) {
    console.error("Error generating branding logo URL:", error);
    return NextResponse.json(
      { error: error?.message || "讀取 logo 失敗" },
      { status: 500 }
    );
  }
}

