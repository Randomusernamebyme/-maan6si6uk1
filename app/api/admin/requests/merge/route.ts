import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "@/lib/firebase/admin";

// 驗證管理員權限
async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    const adminDb = getAdminDb();
    const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      return null;
    }
    
    return decodedToken;
  } catch (error) {
    return null;
  }
}

// POST: 合併委托
export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifyAdmin(request);
    if (!decodedToken) {
      return NextResponse.json(
        { error: "未授權，需要管理員權限" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { mainRequestId, mergeRequestIds } = body;

    if (!mainRequestId || !mergeRequestIds || !Array.isArray(mergeRequestIds)) {
      return NextResponse.json(
        { error: "缺少必要參數" },
        { status: 400 }
      );
    }

    const adminDb = getAdminDb();

    // 更新主委托，添加 mergedWith 欄位
    await adminDb.collection("requests").doc(mainRequestId).update({
      mergedWith: mergeRequestIds,
      updatedAt: new Date(),
    });

    // 標記被合併的委托
    const batch = adminDb.batch();
    mergeRequestIds.forEach((requestId: string) => {
      const ref = adminDb.collection("requests").doc(requestId);
      batch.update(ref, {
        isMerged: true,
        mergedWith: mainRequestId,
        updatedAt: new Date(),
      });
    });

    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error merging requests:", error);
    return NextResponse.json(
      { error: error.message || "合併委托失敗" },
      { status: 500 }
    );
  }
}


