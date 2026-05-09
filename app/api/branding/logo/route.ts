import { NextRequest, NextResponse } from "next/server";
import { brandingLogoPublicId } from "@/lib/storage/asset-keys";
import { imageAssetDeliveryUrl } from "@/lib/storage/image-delivery";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const bust = request.nextUrl.searchParams.get("bust");
  const url = imageAssetDeliveryUrl(brandingLogoPublicId(), bust);
  if (!url) {
    return NextResponse.json(
      {
        error: "圖片託管未設定：請設定 NEXT_PUBLIC_SUPABASE_URL 與 NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET",
      },
      { status: 500 }
    );
  }

  return NextResponse.redirect(url, {
    status: 302,
    headers: {
      "Cache-Control": "private, no-store, must-revalidate",
      Pragma: "no-cache",
    },
  });
}
