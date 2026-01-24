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
    // 為了避免需要複合索引，只查詢 userId，然後在內存中過濾 read 狀態
    let q: any = adminDb
      .collection("notifications")
      .where("userId", "==", decodedToken.uid)
      .orderBy("createdAt", "desc");

    // 如果有限制，獲取更多記錄以確保有足夠的結果（在內存過濾後）
    const limitNum = limit ? parseInt(limit, 10) : null;
    if (limitNum) {
      q = q.limit(limitNum * 2); // 獲取更多以確保有足夠的結果
    }

    const snapshot = await q.get();
    
    // 安全地轉換日期
    const convertTimestamp = (ts: any) => {
      if (!ts) return undefined;
      if (ts.toDate && typeof ts.toDate === 'function') {
        return ts.toDate();
      }
      if (ts instanceof Date) {
        return ts;
      }
      return undefined;
    };
    
    // 轉換數據
    let data = snapshot.docs.map((doc: any) => {
      const docData = doc.data();
      return {
        id: doc.id,
        ...docData,
        createdAt: convertTimestamp(docData.createdAt),
        readAt: convertTimestamp(docData.readAt),
      };
    });

    // 在內存中過濾 read 狀態（避免需要複合索引）
    if (read === "true") {
      data = data.filter((item: any) => item.read === true);
    } else if (read === "false") {
      data = data.filter((item: any) => item.read === false);
    }

    // 類型篩選（在內存中）
    if (type) {
      data = data.filter((item: any) => item.type === type);
    }

    // 如果有限制，應用限制
    if (limitNum) {
      data = data.slice(0, limitNum);
    }

    // 計算未讀數量（從所有通知中計算，不只是當前篩選的）
    // 為了準確計算，我們需要獲取所有未讀通知
    const allNotificationsSnapshot = await adminDb
      .collection("notifications")
      .where("userId", "==", decodedToken.uid)
      .get();
    
    const allNotifications = allNotificationsSnapshot.docs.map((doc: any) => {
      const docData = doc.data();
      return {
        read: docData.read || false,
      };
    });
    
    const unreadCount = allNotifications.filter((item: any) => !item.read).length;

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
