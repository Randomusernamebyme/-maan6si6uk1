import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "@/lib/firebase/admin";

async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // 檢查是否為管理員
    const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      return null;
    }

    return decodedToken;
  } catch (error) {
    console.error("Error verifying admin token:", error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const requestId = params.id;
    const adminDb = getAdminDb();
    const requestDoc = await adminDb.collection("requests").doc(requestId).get();

    if (!requestDoc.exists) {
      return NextResponse.json({ error: "委托不存在" }, { status: 404 });
    }

    const requestData = requestDoc.data();
    
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
      openAt: requestData?.openAt?.toDate?.()?.toISOString(),
      publishedAt: requestData?.publishedAt?.toDate?.()?.toISOString(),
      inProgressAt: requestData?.inProgressAt?.toDate?.()?.toISOString(),
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decodedToken = await verifyAdmin(request);
    if (!decodedToken) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const requestId = params.id;
    const body = await request.json();
    const adminDb = getAdminDb();

    // 檢查委托是否存在
    const requestDoc = await adminDb.collection("requests").doc(requestId).get();
    if (!requestDoc.exists) {
      return NextResponse.json({ error: "委托不存在" }, { status: 404 });
    }

    // 更新委托
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.status) {
      const oldStatus = requestDoc.data()?.status;
      updateData.status = body.status;
      
      // 如果狀態有變化，創建活動日誌
      if (oldStatus !== body.status) {
        try {
          const requestName = requestDoc.data()?.name || "未知委托";
          const statusLabels: Record<string, string> = {
            pending: "待審核",
            open: "已批准",
            published: "已發布",
            matched: "已配對",
            "in-progress": "進行中",
            completed: "已完成",
            cancelled: "已取消",
          };
          
          await adminDb.collection("activity_logs").add({
            userId: decodedToken.uid,
            action: "update_request_status",
            targetType: "request",
            targetId: requestId,
            description: `將委托「${requestName}」的狀態從 ${statusLabels[oldStatus] || oldStatus} 更改為 ${statusLabels[body.status] || body.status}`,
            changes: {
              oldStatus,
              newStatus: body.status,
              requestId: requestId,
              requestName: requestName,
            },
            createdAt: new Date(),
          });
        } catch (logError) {
          console.error("Error creating activity log:", logError);
          // 不影響主要操作
        }
      }
      
      // 根據狀態更新相關時間戳
      const now = new Date();
      if (body.status === "open" && oldStatus === "pending") {
        // 從待審核變為已批准
        updateData.openAt = now;
      } else if (body.status === "published" && oldStatus !== "published") {
        // 變為已發布
        updateData.publishedAt = now;
      } else if (body.status === "matched") {
        updateData.matchedAt = now;
      } else if (body.status === "in-progress" && oldStatus !== "in-progress") {
        // 變為進行中
        updateData.inProgressAt = now;
      } else if (body.status === "completed") {
        updateData.completedAt = now;
        
        // 當請求標記為完成時，自動更新相關的已批准報名記錄為 completed
        const completedAt = new Date();
        const applicationsSnapshot = await adminDb
          .collection("applications")
          .where("requestId", "==", requestId)
          .where("status", "==", "approved")
          .get();
        
        // 獲取請求名稱用於活動日誌
        const requestName = requestDoc.data()?.name || "未知委托";
        
        const updatePromises = applicationsSnapshot.docs.map(async (appDoc) => {
          const appData = appDoc.data();
          
          // 更新報名記錄
          await appDoc.ref.update({
            status: "completed",
            completedAt: completedAt,
            updatedAt: completedAt,
          });
          
          // 為每個報名記錄創建活動日誌
          try {
            const volunteerDoc = await adminDb.collection("users").doc(appData.volunteerId).get();
            const volunteerName = volunteerDoc.exists ? (volunteerDoc.data()?.displayName || volunteerDoc.data()?.email || "未知義工") : "未知義工";
            
            await adminDb.collection("activity_logs").add({
              userId: decodedToken.uid,
              action: "update_application_status",
              targetType: "application",
              targetId: appDoc.id,
              description: `委托「${requestName}」已完成，義工 ${volunteerName} 的報名狀態自動更新為已完成`,
              changes: {
                oldStatus: appData.status,
                newStatus: "completed",
                requestId: requestId,
                volunteerId: appData.volunteerId,
                requestName: requestName,
                volunteerName: volunteerName,
                autoUpdated: true,
              },
              createdAt: completedAt,
            });
          } catch (logError) {
            console.error("Error creating activity log for application:", logError);
            // 不影響主要操作
          }
        });
        
        await Promise.all(updatePromises);
      }
    }

    // 處理跟進記錄更新
    if (body.followUps && Array.isArray(body.followUps)) {
      // 轉換日期為 Firestore Timestamp
      const followUpsWithTimestamps = body.followUps.map((followUp: any) => ({
        ...followUp,
        date: followUp.date instanceof Date ? followUp.date : new Date(followUp.date),
        adminId: decodedToken.uid, // 使用當前管理員 ID
      }));
      updateData.followUps = followUpsWithTimestamps;
    }

    await adminDb.collection("requests").doc(requestId).update(updateData);

    return NextResponse.json({ 
      success: true,
      message: "委托已更新"
    });
  } catch (error: any) {
    console.error("Error updating request:", error);
    return NextResponse.json(
      { error: error.message || "更新委托失敗" },
      { status: 500 }
    );
  }
}
