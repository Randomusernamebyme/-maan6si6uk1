import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "@/lib/firebase/admin";
import { Notification } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

// GET: 獲取當前用戶的通知列表
export async function GET(request: NextRequest) {
  try {
    const decodedToken = await verifyUser(request);
    if (!decodedToken) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const adminDb = getAdminDb();

    // 篩選參數
    const read = searchParams.get("read");
    const type = searchParams.get("type");
    const limit = searchParams.get("limit");

    // 構建查詢
    // 注意：只在 Firestore 中查詢 userId 和 createdAt，避免需要複合索引
    // read 和 type 篩選在內存中進行
    const query = adminDb
      .collection("notifications")
      .where("userId", "==", decodedToken.uid)
      .orderBy("createdAt", "desc");

    const snapshot = await query.get();
    let notifications = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        readAt: data.readAt?.toDate?.()?.toISOString() || undefined,
      } as Notification;
    });

    // 在內存中篩選 read 狀態（避免需要複合索引）
    if (read === "true" || read === "false") {
      notifications = notifications.filter((n) => n.read === (read === "true"));
    }

    // 如果指定了 type 篩選（在內存中篩選，避免需要複合索引）
    if (type) {
      notifications = notifications.filter((n) => n.type === type);
    }

    // 如果指定了 limit
    if (limit) {
      const limitNum = parseInt(limit, 10);
      notifications = notifications.slice(0, limitNum);
    }

    return NextResponse.json(notifications);
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: error.message || "獲取通知失敗" },
      { status: 500 }
    );
  }
}
