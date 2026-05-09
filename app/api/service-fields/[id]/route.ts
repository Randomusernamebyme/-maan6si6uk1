import { NextRequest, NextResponse } from "next/server";
import { serviceFieldPublicId } from "@/lib/storage/asset-keys";
import { imageAssetDeliveryUrl } from "@/lib/storage/image-delivery";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ALLOWED_IDS = new Set(["1", "2", "3"]);

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!ALLOWED_IDS.has(id)) {
    return NextResponse.json({ error: "圖片不存在" }, { status: 404 });
  }

  const url = imageAssetDeliveryUrl(serviceFieldPublicId(id));
  if (!url) {
    return NextResponse.json(
      { error: "圖片託管未設定：請設定 NEXT_PUBLIC_SUPABASE_URL 與 NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET" },
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
