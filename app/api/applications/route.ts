import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "@/lib/firebase/admin";
import { Application } from "@/types";

// 驗證用戶 token
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

// POST: 創建報名記錄
export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifyAuth(request);
    if (!decodedToken) {
      return NextResponse.json(
        { error: "未授權，請先登入" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // 驗證必要欄位
    if (!body.requestId || !body.volunteerId) {
      return NextResponse.json(
        { error: "缺少必要欄位" },
        { status: 400 }
      );
    }

    // 驗證用戶 ID 匹配
    if (body.volunteerId !== decodedToken.uid) {
      return NextResponse.json(
        { error: "無權限" },
        { status: 403 }
      );
    }

    // 檢查是否已經報名過
    const adminDb = getAdminDb();
    const existingApps = await adminDb
      .collection("applications")
      .where("requestId", "==", body.requestId)
      .where("volunteerId", "==", body.volunteerId)
      .get();

    if (!existingApps.empty) {
      return NextResponse.json(
        { error: "您已經報名過此委托" },
        { status: 400 }
      );
    }

    // 創建報名記錄
    const applicationData: Omit<Application, "id" | "createdAt" | "updatedAt"> = {
      requestId: body.requestId,
      volunteerId: body.volunteerId,
      message: body.message && body.message.trim() !== "" ? body.message.trim() : null,
      availableTime: body.availableTime && body.availableTime.trim() !== "" ? body.availableTime.trim() : null,
      status: "pending",
    };

    const docRef = await adminDb.collection("applications").add({
      ...applicationData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 獲取義工信息用於活動日誌
    const volunteerDoc = await adminDb.collection("users").doc(body.volunteerId).get();
    const volunteerName = volunteerDoc.exists ? (volunteerDoc.data()?.displayName || volunteerDoc.data()?.email || "未知義工") : "未知義工";
    
    // 獲取請求信息用於活動日誌
    const requestDoc = await adminDb.collection("requests").doc(body.requestId).get();
    const requestName = requestDoc.exists ? (requestDoc.data()?.name || "未知委托") : "未知委托";

    // 創建活動日誌（異步，不阻塞響應）
    try {
      await adminDb.collection("activity_logs").add({
        userId: decodedToken.uid,
        action: "create",
        targetType: "application",
        targetId: docRef.id,
        description: `義工 ${volunteerName} 報名了委托「${requestName}」`,
        changes: {
          requestId: body.requestId,
          volunteerId: body.volunteerId,
          status: "pending",
        },
        createdAt: new Date(),
      });
    } catch (logError) {
      console.error("Error creating activity log:", logError);
      // 不影響主要操作
    }

    return NextResponse.json(
      { success: true, id: docRef.id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating application:", error);
    return NextResponse.json(
      { error: error.message || "報名失敗，請稍後再試" },
      { status: 500 }
    );
  }
}

