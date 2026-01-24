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

// GET: 獲取當前用戶的通知列表
export async function GET(request: NextRequest) {
  try {
    const decodedToken = await verifyAuth(request);
    if (!decodedToken) {
      return NextResponse.json(
        { error: "未授權，請先登入" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const read = searchParams.get("read"); // "true" | "false" | null
    const type = searchParams.get("type"); // "info" | "success" | "warning" | "error" | null
    const limit = searchParams.get("limit"); // 限制數量

    const adminDb = getAdminDb();
    let q: any = adminDb
      .collection("notifications")
      .where("userId", "==", decodedToken.uid)
      .orderBy("createdAt", "desc");

    // 篩選已讀/未讀
    if (read === "true") {
      q = q.where("read", "==", true);
    } else if (read === "false") {
      q = q.where("read", "==", false);
    }

    // 如果有限制，應用限制
    if (limit) {
      q = q.limit(parseInt(limit, 10));
    }

    const snapshot = await q.get();
    
    // 如果同時有 read 和 type 篩選，需要在內存中過濾
    let data = snapshot.docs.map((doc: any) => {
      const docData = doc.data();
      return {
        id: doc.id,
        ...docData,
        createdAt: docData.createdAt?.toDate(),
        readAt: docData.readAt?.toDate(),
      };
    });

    // 類型篩選（在內存中）
    if (type) {
      data = data.filter((item: any) => item.type === type);
    }

    // 計算未讀數量
    const unreadCount = data.filter((item: any) => !item.read).length;

    return NextResponse.json({
      notifications: data,
      unreadCount,
      total: data.length,
    });
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: error.message || "獲取通知失敗" },
      { status: 500 }
    );
  }
}
