import { NextResponse } from "next/server";
import { cloudinaryImageDeliveryUrl } from "@/lib/cloudinary/delivery";
import { brandingLogoPublicId } from "@/lib/cloudinary/public-ids";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const url = cloudinaryImageDeliveryUrl(brandingLogoPublicId());
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
