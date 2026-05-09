import { NextResponse } from "next/server";
import { brandingLogoPublicId } from "@/lib/storage/asset-keys";
import { imageAssetDeliveryUrl } from "@/lib/storage/image-delivery";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const url = imageAssetDeliveryUrl(brandingLogoPublicId());
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
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
