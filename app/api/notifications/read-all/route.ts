import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "@/lib/firebase/admin";

// 驗證用戶身份
async function verifyUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    return null;
  }
}

// PATCH: 標記所有通知為已讀
export async function PATCH(request: NextRequest) {
  try {
    const decodedToken = await verifyUser(request);
    if (!decodedToken) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const adminDb = getAdminDb();
    
    // 獲取所有未讀通知
    const snapshot = await adminDb
      .collection("notifications")
      .where("userId", "==", decodedToken.uid)
      .where("read", "==", false)
      .get();

    // 批量更新
    const batch = adminDb.batch();
    const now = new Date();
    
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        read: true,
        readAt: now,
      });
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      updatedCount: snapshot.docs.length 
    });
  } catch (error: any) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: error.message || "更新通知失敗" },
      { status: 500 }
    );
  }
}
