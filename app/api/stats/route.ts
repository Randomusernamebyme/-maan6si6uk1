import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

// GET: 獲取公開統計數據（不需要認證）
export async function GET(request: NextRequest) {
  try {
    const adminDb = getAdminDb();

    // 並行獲取所有統計數據與最新完成的委托
    const [
      completedRequestsSnapshot,
      approvedVolunteersSnapshot,
      applicationsSnapshot,
      latestCompletedRequestsSnapshot,
    ] = await Promise.all([
      // 已完成的委托數
      adminDb
        .collection("requests")
        .where("status", "==", "completed")
        .get(),
      
      // 已批准的義工數
      adminDb
        .collection("users")
        .where("role", "==", "volunteer")
        .where("status", "==", "approved")
        .get(),

      // 總報名數
      adminDb
        .collection("applications")
        .get(),

      // 最新完成的委托（只取少量用於首頁展示）
      adminDb
        .collection("requests")
        .orderBy("completedAt", "desc")
        .limit(5)
        .get(),
    ]);

    const latestCompletedRequests = latestCompletedRequestsSnapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || (Array.isArray(data.fields) ? data.fields.join("、") : "未命名委托"),
          district: data.requester?.district || "",
          completedAt: data.completedAt ? data.completedAt.toDate() : null,
          status: data.status,
        };
      })
      .filter((item) => item.status === "completed" && item.completedAt)
      .slice(0, 3);

    return NextResponse.json({
      completedRequests: completedRequestsSnapshot.size,
      activeVolunteers: approvedVolunteersSnapshot.size,
      totalApplications: applicationsSnapshot.size,
      latestCompletedRequests,
    });
  } catch (error: any) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: error.message || "獲取統計數據失敗" },
      { status: 500 }
    );
  }
}
