import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "@/lib/firebase/admin";
import { createNotification } from "@/lib/utils/notifications";

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
    const admin = await verifyAdmin(request);
    if (!admin) {
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
      updateData.status = body.status;
      
      // 根據狀態更新相關時間戳
      if (body.status === "matched") {
        updateData.matchedAt = new Date();
      } else if (body.status === "completed") {
        updateData.completedAt = new Date();
        
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
          
          // 為每個報名記錄創建活動日誌和通知
          try {
            const volunteerDoc = await adminDb.collection("users").doc(appData.volunteerId).get();
            const volunteerName = volunteerDoc.exists ? (volunteerDoc.data()?.displayName || volunteerDoc.data()?.email || "未知義工") : "未知義工";
            
            await adminDb.collection("activity_logs").add({
              userId: admin.uid,
              action: "update_application_status",
              targetType: "application",
              targetId: appDoc.id,
              description: `委托「${requestName}」已完成，義工 ${volunteerName} 的報名狀態自動更新為已完成`,
              changes: {
                oldStatus: appData.status,
                newStatus: "completed",
                requestId: requestId,
                volunteerId: appData.volunteerId,
                autoUpdated: true,
              },
              createdAt: completedAt,
            });

            // 創建通知給義工
            try {
              await createNotification(
                appData.volunteerId,
                "委托已完成",
                `您參與的委托「${requestName}」已完成。感謝您的服務！`,
                "success",
                {
                  relatedRequestId: requestId,
                  relatedApplicationId: appDoc.id,
                }
              );
            } catch (notifError) {
              console.error("Error creating notification for volunteer:", notifError);
              // 不影響主要操作
            }
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
        adminId: admin.uid, // 使用當前管理員 ID
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
