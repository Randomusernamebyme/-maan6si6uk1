import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "@/lib/firebase/admin";

// 驗證義工權限並檢查是否已報名
async function verifyVolunteerAndApplication(
  request: NextRequest,
  requestId: string
) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const decodedToken = await adminAuth.verifyIdToken(token);

    // 檢查是否為義工
    const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== "volunteer") {
      return null;
    }

    // 檢查義工是否已報名此 request
    const applicationsSnapshot = await adminDb
      .collection("applications")
      .where("requestId", "==", requestId)
      .where("volunteerId", "==", decodedToken.uid)
      .limit(1)
      .get();

    if (applicationsSnapshot.empty) {
      // 如果沒有報名，檢查 request 是否為 published 或 open（義工可以查看公開的 request）
      const requestDoc = await adminDb.collection("requests").doc(requestId).get();
      if (!requestDoc.exists) {
        return null;
      }
      const requestData = requestDoc.data();
      if (requestData?.status !== "published" && requestData?.status !== "open") {
        return null; // 義工只能查看已報名的或公開的 request
      }
    }

    return decodedToken;
  } catch (error) {
    console.error("Error verifying volunteer:", error);
    return null;
  }
}

// GET: 獲取委托詳情（義工可以查看已報名的或公開的委托）
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decodedToken = await verifyVolunteerAndApplication(request, params.id);
    if (!decodedToken) {
      return NextResponse.json(
        { error: "未授權或您未報名此委托" },
        { status: 401 }
      );
    }

    const adminDb = getAdminDb();
    const requestDoc = await adminDb.collection("requests").doc(params.id).get();

    if (!requestDoc.exists) {
      return NextResponse.json(
        { error: "委托不存在" },
        { status: 404 }
      );
    }

    const requestData = requestDoc.data();
    
    // 處理日期字段
    const formatDate = (date: any): string | undefined => {
      if (!date) return undefined;
      if (date.toDate) {
        return date.toDate().toISOString();
      }
      if (date instanceof Date) {
        return date.toISOString();
      }
      return undefined;
    };

    return NextResponse.json({
      id: requestDoc.id,
      ...requestData,
      createdAt: formatDate(requestData?.createdAt),
      updatedAt: formatDate(requestData?.updatedAt),
      matchedAt: formatDate(requestData?.matchedAt),
      completedAt: formatDate(requestData?.completedAt),
    });
  } catch (error: any) {
    console.error("Error fetching request:", error);
    return NextResponse.json(
      { error: error.message || "獲取委托詳情失敗" },
      { status: 500 }
    );
  }
}

