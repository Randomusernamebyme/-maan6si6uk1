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

// GET: 獲取管理員儀表板統計數據
export async function GET(request: NextRequest) {
  try {
    const decodedToken = await verifyAdmin(request);
    if (!decodedToken) {
      return NextResponse.json(
        { error: "未授權，需要管理員權限" },
        { status: 401 }
      );
    }

    const adminDb = getAdminDb();

    // 並行獲取所有統計數據
    const [
      pendingRequestsSnapshot,
      pendingVolunteersSnapshot,
      inProgressRequestsSnapshot,
      totalVolunteersSnapshot,
    ] = await Promise.all([
      // 待審核委托數
      adminDb
        .collection("requests")
        .where("status", "==", "pending")
        .get(),
      
      // 待審核義工數
      adminDb
        .collection("users")
        .where("role", "==", "volunteer")
        .where("status", "==", "pending")
        .get(),
      
      // 進行中委托數（matched 或 in-progress）
      adminDb
        .collection("requests")
        .where("status", "in", ["matched", "in-progress"])
        .get(),
      
      // 總義工人數
      adminDb
        .collection("users")
        .where("role", "==", "volunteer")
        .get(),
    ]);

    // 獲取待審核委托的詳細信息（包括名稱）
    const pendingRequestsList = pendingRequestsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      name: doc.data().name || (Array.isArray(doc.data().fields) ? doc.data().fields.join("、") : "未命名委托"),
      status: doc.data().status,
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
    }));

    return NextResponse.json({
      pendingRequests: pendingRequestsSnapshot.size,
      pendingVolunteers: pendingVolunteersSnapshot.size,
      inProgressRequests: inProgressRequestsSnapshot.size,
      totalVolunteers: totalVolunteersSnapshot.size,
      pendingRequestsList: pendingRequestsList.slice(0, 10), // 只返回最近10個
    });
  } catch (error: any) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: error.message || "獲取統計數據失敗" },
      { status: 500 }
    );
  }
}
