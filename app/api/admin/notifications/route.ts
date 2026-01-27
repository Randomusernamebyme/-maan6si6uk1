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
    const { userId, title, message, type, relatedRequestId, relatedApplicationId } = body;

    // 驗證必填字段
    if (!userId || !title || !message || !type) {
      return NextResponse.json(
        { error: "缺少必填字段" },
        { status: 400 }
      );
    }

    // 驗證類型
    if (!["info", "success", "warning", "error"].includes(type)) {
      return NextResponse.json(
        { error: "無效的通知類型" },
        { status: 400 }
      );
    }

    const adminDb = getAdminDb();
    const docRef = await adminDb.collection("notifications").add({
      userId,
      title,
      message,
      type,
      relatedRequestId: relatedRequestId || null,
      relatedApplicationId: relatedApplicationId || null,
      read: false,
      createdAt: new Date(),
    });

    return NextResponse.json({
      id: docRef.id,
      success: true,
    });
  } catch (error: any) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: error.message || "創建通知失敗" },
      { status: 500 }
    );
  }
}
