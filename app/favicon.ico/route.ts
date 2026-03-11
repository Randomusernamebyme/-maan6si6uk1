import { NextResponse } from "next/server";

export async function GET() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Content-Type": "image/x-icon",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
