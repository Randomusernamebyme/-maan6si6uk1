import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "@/lib/firebase/admin";

// 驗證用戶身份
async function verifyAuth(request: NextRequest) {
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
    const decodedToken = await verifyAuth(request);
    if (!decodedToken) {
      return NextResponse.json(
        { error: "未授權，請先登入" },
        { status: 401 }
      );
    }

    const adminDb = getAdminDb();
    
    // 獲取所有通知（避免需要複合索引），然後在內存中過濾
    const snapshot = await adminDb
      .collection("notifications")
      .where("userId", "==", decodedToken.uid)
      .get();
    
    // 過濾出未讀通知
    const unreadDocs = snapshot.docs.filter((doc) => {
      const data = doc.data();
      return !data.read;
    });

    if (unreadDocs.length === 0) {
      return NextResponse.json({
        success: true,
        updatedCount: 0,
        message: "沒有未讀通知",
      });
    }

    // 批量更新
    const batch = adminDb.batch();
    const now = new Date();
    
    unreadDocs.forEach((doc) => {
      batch.update(doc.ref, {
        read: true,
        readAt: now,
        updatedAt: now,
      });
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      updatedCount: unreadDocs.length,
      message: `已標記 ${unreadDocs.length} 條通知為已讀`,
    });
  } catch (error: any) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json(
      { error: error.message || "標記通知失敗" },
      { status: 500 }
    );
  }
}
