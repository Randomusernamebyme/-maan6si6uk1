import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = params.id;
    if (!requestId) {
      return NextResponse.json({ error: "缺少委托 ID" }, { status: 400 });
    }

    const adminDb = getAdminDb();
    const requestDoc = await adminDb.collection("requests").doc(requestId).get();
    if (!requestDoc.exists) {
      return NextResponse.json({ error: "委托不存在" }, { status: 404 });
    }

    const data = requestDoc.data() || {};
    const isOpenForApplication = data.status === "published" || data.status === "open";
    if (!isOpenForApplication) {
      return NextResponse.json({ error: "此委托目前未開放申請" }, { status: 404 });
    }

    return NextResponse.json({
      id: requestDoc.id,
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
    });
  } catch (error: any) {
    console.error("Error fetching public request detail:", error);
    return NextResponse.json(
      { error: error.message || "載入委托資料失敗" },
      { status: 500 }
    );
  }
}
