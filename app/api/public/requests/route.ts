import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Change the 50 in const limit to up the maximum allowed request count allowed by this backend api
    // - Tsuyu
    const { searchParams } = new URL(request.url);
    const limitParam = Number(searchParams.get("limit") || 6);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 6;

    const adminDb = getAdminDb();
    const snapshot = await adminDb
      .collection("requests")
      .where("status", "in", ["published", "open"])
      .get();

    const items = snapshot.docs
      .map((doc) => {
        const data = doc.data() || {};
        return {
          id: doc.id,
          name: data.name || "",
          description: data.description || "",
          fields: Array.isArray(data.fields) ? data.fields : [],
          urgency: data.urgency || "normal",
          serviceType: data.serviceType || "",
          estimatedDuration: data.estimatedDuration || "",
          appreciation: data.appreciation || "",
          status: data.status || "published",
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        };
      })
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, limit);

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("Error fetching public requests:", error);
    return NextResponse.json(
      { error: error.message || "載入公開委托失敗" },
      { status: 500 }
    );
  }
}
