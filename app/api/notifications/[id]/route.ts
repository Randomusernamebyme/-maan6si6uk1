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

// GET: 獲取單個通知詳情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decodedToken = await verifyUser(request);
    if (!decodedToken) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const adminDb = getAdminDb();
    const notificationDoc = await adminDb
      .collection("notifications")
      .doc(params.id)
      .get();

    if (!notificationDoc.exists) {
      return NextResponse.json({ error: "通知不存在" }, { status: 404 });
    }

    const data = notificationDoc.data();
    
    // 檢查用戶是否有權限訪問此通知
    if (data?.userId !== decodedToken.uid) {
      return NextResponse.json({ error: "無權限訪問此通知" }, { status: 403 });
    }

    return NextResponse.json({
      id: notificationDoc.id,
      ...data,
      createdAt: data?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      readAt: data?.readAt?.toDate?.()?.toISOString() || undefined,
    });
  } catch (error: any) {
    console.error("Error fetching notification:", error);
    return NextResponse.json(
      { error: error.message || "獲取通知失敗" },
      { status: 500 }
    );
  }
}

// PATCH: 標記通知為已讀
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decodedToken = await verifyUser(request);
    if (!decodedToken) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const adminDb = getAdminDb();
    const notificationDoc = await adminDb
      .collection("notifications")
      .doc(params.id)
      .get();

    if (!notificationDoc.exists) {
      return NextResponse.json({ error: "通知不存在" }, { status: 404 });
    }

    const data = notificationDoc.data();
    
    // 檢查用戶是否有權限訪問此通知
    if (data?.userId !== decodedToken.uid) {
      return NextResponse.json({ error: "無權限訪問此通知" }, { status: 403 });
    }

    // 更新通知為已讀
    await notificationDoc.ref.update({
      read: true,
      readAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: error.message || "更新通知失敗" },
      { status: 500 }
    );
  }
}
