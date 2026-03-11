import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

// GET: 獲取公開統計數據（不需要認證）
export async function GET(request: NextRequest) {
  try {
    const adminDb = getAdminDb();

    // 並行獲取所有統計數據
    const [completedRequestsSnapshot, approvedVolunteersSnapshot, applicationsSnapshot] =
      await Promise.all([
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
    ]);

    const totalVolunteerHours = approvedVolunteersSnapshot.docs.reduce((sum, doc) => {
      const hours = Number(doc.data()?.totalVolunteerHours || 0);
      return sum + (Number.isFinite(hours) ? hours : 0);
    }, 0);

    return NextResponse.json({
      completedRequests: completedRequestsSnapshot.size,
      activeVolunteers: approvedVolunteersSnapshot.size,
      totalApplications: applicationsSnapshot.size,
      totalVolunteerHours,
    });
  } catch (error: any) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: error.message || "獲取統計數據失敗" },
      { status: 500 }
    );
  }
}
