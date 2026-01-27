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

// GET: 獲取義工詳情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decodedToken = await verifyAdmin(request);
    if (!decodedToken) {
      return NextResponse.json(
        { error: "未授權，需要管理員權限" },
        { status: 401 }
      );
    }

    const adminDb = getAdminDb();
    const userDoc = await adminDb.collection("users").doc(params.id).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "義工不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: userDoc.id,
      ...userDoc.data(),
    });
  } catch (error: any) {
    console.error("Error fetching volunteer:", error);
    return NextResponse.json(
      { error: error.message || "獲取義工詳情失敗" },
      { status: 500 }
    );
  }
}

// PATCH: 更新義工狀態或資料
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decodedToken = await verifyAdmin(request);
    if (!decodedToken) {
      return NextResponse.json(
        { error: "未授權，需要管理員權限" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const adminDb = getAdminDb();
    const userRef = adminDb.collection("users").doc(params.id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "義工不存在" },
        { status: 404 }
      );
    }

    const oldData = userDoc.data();
    const oldStatus = oldData?.status;

    // 更新文檔
    await userRef.update({
      ...body,
      updatedAt: new Date(),
    });

    // 如果狀態有變化，創建活動日誌
    if (body.status && body.status !== oldStatus) {
      try {
        const volunteerName = oldData?.displayName || oldData?.email || "未知義工";
        
        const statusLabels: Record<string, string> = {
          pending: "待審核",
          approved: "已批准",
          rejected: "已拒絕",
          suspended: "已暫停",
        };

        await adminDb.collection("activity_logs").add({
          userId: decodedToken.uid,
          action: "update_volunteer_status",
          targetType: "user",
          targetId: params.id,
          description: `將義工 ${volunteerName} 的狀態從 ${statusLabels[oldStatus] || oldStatus} 更改為 ${statusLabels[body.status] || body.status}`,
          changes: {
            oldStatus,
            newStatus: body.status,
            volunteerId: params.id,
            volunteerName: volunteerName,
          },
          createdAt: new Date(),
        });
        
        // 創建通知給義工（狀態變更）
        try {
          if (body.status === "approved") {
            await adminDb.collection("notifications").add({
              userId: params.id,
              title: "註冊已批准",
              message: `恭喜！您的義工註冊申請已獲批准，現在可以開始報名委托了！`,
              type: "success",
              read: false,
              createdAt: new Date(),
            });
          } else if (body.status === "rejected") {
            await adminDb.collection("notifications").add({
              userId: params.id,
              title: "註冊未獲批准",
              message: `很抱歉，您的義工註冊申請未獲批准。如有疑問，請聯繫管理員。`,
              type: "warning",
              read: false,
              createdAt: new Date(),
            });
          } else if (body.status === "suspended") {
            await adminDb.collection("notifications").add({
              userId: params.id,
              title: "帳號已暫停",
              message: `您的義工帳號已被暫停。如有疑問，請聯繫管理員。`,
              type: "error",
              read: false,
              createdAt: new Date(),
            });
          }
        } catch (notifError) {
          console.error("Error creating notification:", notifError);
          // 不影響主要操作
        }
      } catch (logError) {
        console.error("Error creating activity log:", logError);
        // 不影響主要操作
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating volunteer:", error);
    return NextResponse.json(
      { error: error.message || "更新義工資料失敗" },
      { status: 500 }
    );
  }
}


