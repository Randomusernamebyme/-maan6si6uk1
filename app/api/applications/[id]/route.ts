import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "@/lib/firebase/admin";

// 驗證用戶 token（義工或管理員）
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

// 驗證管理員權限
async function verifyAdmin(request: NextRequest) {
  const decodedToken = await verifyAuth(request);
  if (!decodedToken) return null;

  const adminDb = getAdminDb();
  const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
  if (!userDoc.exists || userDoc.data()?.role !== "admin") {
    return null;
  }
  
  return decodedToken;
}

// DELETE: 撤回報名
export async function DELETE(
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
    const applicationRef = adminDb.collection("applications").doc(params.id);
    const applicationDoc = await applicationRef.get();

    if (!applicationDoc.exists) {
      return NextResponse.json(
        { error: "報名記錄不存在" },
        { status: 404 }
      );
    }

    const applicationData = applicationDoc.data();
    
    // 驗證用戶 ID 匹配（義工只能撤回自己的報名）
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin && applicationData?.volunteerId !== decodedToken.uid) {
      return NextResponse.json(
        { error: "無權限" },
        { status: 403 }
      );
    }

    // 只能撤回待處理狀態的報名
    if (applicationData?.status !== "pending" && !isAdmin) {
      return NextResponse.json(
        { error: "只能撤回待處理狀態的報名" },
        { status: 400 }
      );
    }

    // 獲取義工和請求信息用於活動日誌
    let volunteerName = "未知義工";
    let requestName = "未知委托";
    
    try {
      if (applicationData?.volunteerId) {
        const volunteerDoc = await adminDb.collection("users").doc(applicationData.volunteerId).get();
        if (volunteerDoc.exists) {
          volunteerName = volunteerDoc.data()?.displayName || volunteerDoc.data()?.email || "未知義工";
        }
      }
      
      if (applicationData?.requestId) {
        const requestDoc = await adminDb.collection("requests").doc(applicationData.requestId).get();
        if (requestDoc.exists) {
          requestName = requestDoc.data()?.name || "未知委托";
        }
      }
    } catch (err) {
      console.error("Error fetching related data for activity log:", err);
    }

    // 刪除報名記錄
    await applicationRef.delete();

    // 創建活動日誌（異步，不阻塞響應）
    try {
      const isAdmin = await verifyAdmin(request);
      await adminDb.collection("activity_logs").add({
        userId: decodedToken.uid,
        action: isAdmin ? "delete" : "withdraw",
        targetType: "application",
        targetId: params.id,
        description: isAdmin 
          ? `管理員刪除了義工 ${volunteerName} 對委托「${requestName}」的報名`
          : `義工 ${volunteerName} 撤回了對委托「${requestName}」的報名`,
        changes: {
          requestId: applicationData?.requestId,
          volunteerId: applicationData?.volunteerId,
          status: applicationData?.status,
          requestName: requestName,
          volunteerName: volunteerName,
        },
        createdAt: new Date(),
      });
    } catch (logError) {
      console.error("Error creating activity log:", logError);
      // 不影響主要操作
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting application:", error);
    return NextResponse.json(
      { error: error.message || "撤回失敗，請稍後再試" },
      { status: 500 }
    );
  }
}

// PATCH: 更新報名狀態（管理員）
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
    const applicationRef = adminDb.collection("applications").doc(params.id);
    const applicationDoc = await applicationRef.get();

    if (!applicationDoc.exists) {
      return NextResponse.json(
        { error: "報名記錄不存在" },
        { status: 404 }
      );
    }

    const oldData = applicationDoc.data();
    const oldStatus = oldData?.status;

    await applicationRef.update({
      ...body,
      updatedAt: new Date(),
    });

    // 獲取更新後的狀態
    const newStatus = body.status || oldStatus;

    // 如果狀態有變化，創建活動日誌
    if (body.status && body.status !== oldStatus) {
      try {
        // 獲取義工信息
        const volunteerDoc = await adminDb.collection("users").doc(oldData?.volunteerId).get();
        const volunteerName = volunteerDoc.exists ? (volunteerDoc.data()?.displayName || volunteerDoc.data()?.email || "未知義工") : "未知義工";
        
        // 獲取請求信息
        const requestDoc = await adminDb.collection("requests").doc(oldData?.requestId).get();
        const requestName = requestDoc.exists ? (requestDoc.data()?.name || "未知委托") : "未知委托";

        const statusLabels: Record<string, string> = {
          pending: "待處理",
          approved: "已選中",
          rejected: "未選中",
          completed: "已完成",
        };

        await adminDb.collection("activity_logs").add({
          userId: decodedToken.uid,
          action: "update_application_status",
          targetType: "application",
          targetId: params.id,
          description: `將義工 ${volunteerName} 對委托「${requestName}」的報名狀態從 ${statusLabels[oldStatus] || oldStatus} 更改為 ${statusLabels[newStatus] || newStatus}`,
          changes: {
            oldStatus,
            newStatus,
            requestId: oldData?.requestId,
            volunteerId: oldData?.volunteerId,
            requestName: requestName,
            volunteerName: volunteerName,
          },
          createdAt: new Date(),
        });
      } catch (logError) {
        console.error("Error creating activity log:", logError);
        // 不影響主要操作
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: error.message || "更新失敗，請稍後再試" },
      { status: 500 }
    );
  }
}
