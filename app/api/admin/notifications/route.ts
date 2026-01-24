import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "@/lib/firebase/admin";
import { Notification } from "@/types";

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

// POST: 創建通知（管理員專用）
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

    // 驗證必要欄位
    if (!body.userId || !body.title || !body.message || !body.type) {
      return NextResponse.json(
        { error: "缺少必要欄位：userId, title, message, type" },
        { status: 400 }
      );
    }

    // 驗證類型
    const validTypes = ["info", "success", "warning", "error"];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: `無效的通知類型，必須是：${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const adminDb = getAdminDb();
    
    // 創建通知數據
    const notificationData: Omit<Notification, "id"> = {
      userId: body.userId,
      title: body.title,
      message: body.message,
      type: body.type,
      relatedRequestId: body.relatedRequestId || undefined,
      relatedApplicationId: body.relatedApplicationId || undefined,
      read: false,
      createdAt: new Date(),
    };

    const docRef = await adminDb.collection("notifications").add(notificationData);

    return NextResponse.json(
      {
        success: true,
        id: docRef.id,
        notification: {
          id: docRef.id,
          ...notificationData,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: error.message || "創建通知失敗" },
      { status: 500 }
    );
  }
}
