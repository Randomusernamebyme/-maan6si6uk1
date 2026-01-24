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

// GET: 獲取單個通知詳情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decodedToken = await verifyAuth(request);
    if (!decodedToken) {
      return NextResponse.json(
        { error: "未授權，請先登入" },
        { status: 401 }
      );
    }

    const adminDb = getAdminDb();
    const notificationDoc = await adminDb
      .collection("notifications")
      .doc(params.id)
      .get();

    if (!notificationDoc.exists) {
      return NextResponse.json(
        { error: "通知不存在" },
        { status: 404 }
      );
    }

    const docData = notificationDoc.data();
    
    // 驗證用戶是否有權限讀取此通知
    if (docData?.userId !== decodedToken.uid) {
      return NextResponse.json(
        { error: "無權限訪問此通知" },
        { status: 403 }
      );
    }

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

    return NextResponse.json({
      id: notificationDoc.id,
      ...docData,
      createdAt: convertTimestamp(docData?.createdAt),
      readAt: convertTimestamp(docData?.readAt),
    });
  } catch (error: any) {
    console.error("Error fetching notification:", error);
    return NextResponse.json(
      { error: error.message || "獲取通知失敗" },
      { status: 500 }
    );
  }
}

// PATCH: 更新通知（主要用於標記為已讀）
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decodedToken = await verifyAuth(request);
    if (!decodedToken) {
      return NextResponse.json(
        { error: "未授權，請先登入" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const adminDb = getAdminDb();
    const notificationRef = adminDb.collection("notifications").doc(params.id);
    const notificationDoc = await notificationRef.get();

    if (!notificationDoc.exists) {
      return NextResponse.json(
        { error: "通知不存在" },
        { status: 404 }
      );
    }

    const docData = notificationDoc.data();
    
    // 驗證用戶是否有權限更新此通知
    if (docData?.userId !== decodedToken.uid) {
      return NextResponse.json(
        { error: "無權限更新此通知" },
        { status: 403 }
      );
    }

    // 更新通知
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.read !== undefined) {
      updateData.read = body.read;
      if (body.read && !docData?.readAt) {
        updateData.readAt = new Date();
      }
    }

    await notificationRef.update(updateData);

    // 獲取更新後的通知
    const updatedDoc = await notificationRef.get();
    const updatedData = updatedDoc.data();

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

    return NextResponse.json({
      id: updatedDoc.id,
      ...updatedData,
      createdAt: convertTimestamp(updatedData?.createdAt),
      readAt: convertTimestamp(updatedData?.readAt),
    });
  } catch (error: any) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: error.message || "更新通知失敗" },
      { status: 500 }
    );
  }
}
