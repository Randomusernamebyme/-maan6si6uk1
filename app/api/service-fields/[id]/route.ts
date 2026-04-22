import { NextRequest, NextResponse } from "next/server";
import { cloudinaryImageDeliveryUrl } from "@/lib/cloudinary/delivery";
import { serviceFieldPublicId } from "@/lib/cloudinary/public-ids";

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

  const url = cloudinaryImageDeliveryUrl(serviceFieldPublicId(id));
  if (!url) {
    return NextResponse.json(
      { error: "Cloudinary 未設定：請設定 CLOUDINARY_CLOUD_NAME 或 NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME" },
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
