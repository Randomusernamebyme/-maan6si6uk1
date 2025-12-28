import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "@/lib/firebase/admin";
import { ActivityLog } from "@/types";

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

// GET: 獲取操作日誌
export async function GET(request: NextRequest) {
  try {
    const decodedToken = await verifyAdmin(request);
    if (!decodedToken) {
      return NextResponse.json(
        { error: "未授權，需要管理員權限" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const adminDb = getAdminDb();
    let q: any = adminDb.collection("activity_logs").orderBy("createdAt", "desc");

    // 篩選參數
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (userId) {
      q = q.where("userId", "==", userId);
    }
    if (action) {
      q = q.where("action", "==", action);
    }

    const snapshot = await q.get();
    const logs = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    }));

    // 日期範圍篩選（在內存中處理，因為 Firestore 查詢限制）
    let filteredLogs = logs;
    if (startDate || endDate) {
      filteredLogs = logs.filter((log: any) => {
        const logDate = log.createdAt;
        if (!logDate) return false;
        if (startDate && logDate < new Date(startDate)) return false;
        if (endDate && logDate > new Date(endDate)) return false;
        return true;
      });
    }

    return NextResponse.json(filteredLogs);
  } catch (error: any) {
    console.error("Error fetching logs:", error);
    return NextResponse.json(
      { error: error.message || "獲取操作日誌失敗" },
      { status: 500 }
    );
  }
}

// POST: 創建操作日誌
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
    const { action, targetType, targetId, description, changes } = body;

    if (!action || !targetType || !targetId || !description) {
      return NextResponse.json(
        { error: "缺少必要欄位" },
        { status: 400 }
      );
    }

    const adminDb = getAdminDb();
    const logData: Omit<ActivityLog, "id" | "createdAt"> = {
      userId: decodedToken.uid,
      action,
      targetType,
      targetId,
      description,
      changes,
    };

    await adminDb.collection("activity_logs").add({
      ...logData,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error creating log:", error);
    return NextResponse.json(
      { error: error.message || "創建操作日誌失敗" },
      { status: 500 }
    );
  }
}

