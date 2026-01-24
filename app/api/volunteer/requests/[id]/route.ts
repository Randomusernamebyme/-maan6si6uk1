import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "@/lib/firebase/admin";

// 驗證義工權限
async function verifyVolunteer(request: NextRequest) {
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
    if (!userDoc.exists) {
      return null;
    }
    
    const userData = userDoc.data();
    // 允許義工和管理員
    if (userData?.role === "volunteer" || userData?.role === "admin") {
      return decodedToken;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

// GET: 獲取請求詳情（義工專用）
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decodedToken = await verifyVolunteer(request);
    if (!decodedToken) {
      return NextResponse.json(
        { error: "未授權，請先登入" },
        { status: 401 }
      );
    }

    const requestId = params.id;
    const adminDb = getAdminDb();
    const requestDoc = await adminDb.collection("requests").doc(requestId).get();

    if (!requestDoc.exists) {
      return NextResponse.json({ error: "委托不存在" }, { status: 404 });
    }

    const requestData = requestDoc.data();
    
    // 檢查用戶是否有權限查看此請求
    // 1. 如果是 published 或 open 狀態，任何義工都可以查看
    // 2. 如果是其他狀態，檢查義工是否已報名此請求
    const userRole = (await adminDb.collection("users").doc(decodedToken.uid).get()).data()?.role;
    
    if (userRole === "admin") {
      // 管理員可以查看所有請求
    } else if (requestData?.status === "published" || requestData?.status === "open") {
      // 已發布的請求，任何義工都可以查看
    } else {
      // 其他狀態，檢查義工是否已報名
      const applicationSnapshot = await adminDb
        .collection("applications")
        .where("requestId", "==", requestId)
        .where("volunteerId", "==", decodedToken.uid)
        .limit(1)
        .get();
      
      if (applicationSnapshot.empty) {
        return NextResponse.json(
          { error: "無權限查看此委托" },
          { status: 403 }
        );
      }
    }
    
    // 處理 followUps 中的日期
    let followUps = requestData?.followUps;
    if (Array.isArray(followUps)) {
      followUps = followUps.map((followUp: any) => ({
        ...followUp,
        date: followUp.date?.toDate?.()?.toISOString() || followUp.date,
      }));
    }
    
    return NextResponse.json({
      id: requestDoc.id,
      ...requestData,
      createdAt: requestData?.createdAt?.toDate?.()?.toISOString(),
      updatedAt: requestData?.updatedAt?.toDate?.()?.toISOString(),
      matchedAt: requestData?.matchedAt?.toDate?.()?.toISOString(),
      completedAt: requestData?.completedAt?.toDate?.()?.toISOString(),
      followUps: followUps,
    });
  } catch (error: any) {
    console.error("Error fetching request:", error);
    return NextResponse.json(
      { error: error.message || "獲取委托失敗" },
      { status: 500 }
    );
  }
}
