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
    
    // 篩選參數
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");
    const targetType = searchParams.get("targetType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // 為了避免需要複合索引，我們先獲取所有日誌，然後在內存中篩選和排序
    // 如果只有一個篩選條件，可以使用 Firestore 查詢優化
    let q: any = adminDb.collection("activity_logs");
    
    // 如果只有一個篩選條件，可以使用 where 查詢
    // 否則獲取所有數據在內存中篩選
    const filterCount = [userId, action, targetType].filter(Boolean).length;
    
    if (filterCount === 1) {
      // 只有一個篩選條件，可以使用 where + orderBy
      if (userId) {
        q = q.where("userId", "==", userId);
      } else if (action) {
        q = q.where("action", "==", action);
      } else if (targetType) {
        q = q.where("targetType", "==", targetType);
      }
      q = q.orderBy("createdAt", "desc");
    } else if (filterCount === 0) {
      // 沒有篩選條件，直接排序
      q = q.orderBy("createdAt", "desc");
    }
    // 如果有多個篩選條件，不添加 where，在內存中處理

    const snapshot = await q.get();
    let logs = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    }));

    // 在內存中進行多條件篩選（如果需要）
    if (filterCount > 1) {
      logs = logs.filter((log: any) => {
        if (userId && log.userId !== userId) return false;
        if (action && log.action !== action) return false;
        if (targetType && log.targetType !== targetType) return false;
        return true;
      });
      
      // 在內存中排序
      logs.sort((a: any, b: any) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    }

    // 獲取所有操作人的用戶信息
    const userIds = [...new Set(logs.map((log: any) => log.userId).filter(Boolean))] as string[];
    const userMap = new Map<string, string>();
    
    if (userIds.length > 0) {
      const userDocs = await Promise.all(
        userIds.map((uid) => adminDb.collection("users").doc(uid).get())
      );
      
      userDocs.forEach((userDoc) => {
        if (userDoc.exists) {
          const userData = userDoc.data();
          userMap.set(userDoc.id, userData?.displayName || userData?.email || "未知用戶");
        }
      });
    }

    // 為每個日誌添加操作人名稱
    const logsWithNames = logs.map((log: any) => ({
      ...log,
      adminName: userMap.get(log.userId) || "未知",
    }));

    // 日期範圍篩選（在內存中處理，因為 Firestore 查詢限制）
    let filteredLogs = logsWithNames;
    if (startDate || endDate) {
      filteredLogs = logsWithNames.filter((log: any) => {
        const logDate = log.createdAt;
        if (!logDate) return false;
        
        // 處理開始日期（只比較日期部分，不包含時間）
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          const logDateStart = new Date(logDate);
          logDateStart.setHours(0, 0, 0, 0);
          if (logDateStart < start) return false;
        }
        
        // 處理結束日期（包含當天的最後一刻）
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (logDate > end) return false;
        }
        
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

