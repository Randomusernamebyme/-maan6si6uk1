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
      message: body.message,
      status: "pending",
    };

    const docRef = await adminDb.collection("applications").add({
      ...applicationData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

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

