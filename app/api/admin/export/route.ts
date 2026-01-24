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

// GET: 獲取匯出數據
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
    const exportType = searchParams.get("type") as "requests" | "volunteers" | "applications";
    const statusFilter = searchParams.get("status") || "all";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const adminDb = getAdminDb();
    let data: any[] = [];

    if (exportType === "requests") {
      let q: any = adminDb.collection("requests");
      
      if (statusFilter !== "all") {
        q = q.where("status", "==", statusFilter);
      }

      const snapshot = await q.get();
      data = snapshot.docs.map((doc: any) => {
        const docData = doc.data();
        return {
          id: doc.id,
          ...docData,
          createdAt: docData.createdAt?.toDate(),
          updatedAt: docData.updatedAt?.toDate(),
          matchedAt: docData.matchedAt?.toDate(),
          completedAt: docData.completedAt?.toDate(),
        };
      });
      
      // 日期篩選
      if (startDate || endDate) {
        data = data.filter((item) => {
          const itemDate = item.createdAt;
          if (!itemDate) return false;
          
          if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (itemDate < start) return false;
          }
          
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (itemDate > end) return false;
          }
          
          return true;
        });
      }
      
      // 排序
      data.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

    } else if (exportType === "volunteers") {
      let q: any = adminDb.collection("users").where("role", "==", "volunteer");
      
      if (statusFilter !== "all") {
        q = q.where("status", "==", statusFilter);
      }

      const snapshot = await q.get();
      data = snapshot.docs.map((doc: any) => {
        const docData = doc.data();
        return {
          uid: doc.id,
          ...docData,
          createdAt: docData.createdAt?.toDate(),
          updatedAt: docData.updatedAt?.toDate(),
          interviewDate: docData.interviewDate?.toDate(),
          lastLoginAt: docData.lastLoginAt?.toDate(),
        };
      });
      
      // 日期篩選
      if (startDate || endDate) {
        data = data.filter((item) => {
          const itemDate = item.createdAt;
          if (!itemDate) return false;
          
          if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (itemDate < start) return false;
          }
          
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (itemDate > end) return false;
          }
          
          return true;
        });
      }
      
      // 排序
      data.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

    } else if (exportType === "applications") {
      let q: any = adminDb.collection("applications");
      
      if (statusFilter !== "all") {
        q = q.where("status", "==", statusFilter);
      }

      const snapshot = await q.get();
      
      // 獲取相關的委托和義工信息
      const requestIds = [...new Set(snapshot.docs.map((doc: any) => doc.data().requestId).filter(Boolean))];
      const volunteerIds = [...new Set(snapshot.docs.map((doc: any) => doc.data().volunteerId).filter(Boolean))];
      
      const [requestDocs, volunteerDocs] = await Promise.all([
        Promise.all(requestIds.map((id: string) => adminDb.collection("requests").doc(id).get())),
        Promise.all(volunteerIds.map((id: string) => adminDb.collection("users").doc(id).get())),
      ]);
      
      const requestMap = new Map();
      requestDocs.forEach((doc) => {
        if (doc.exists) {
          requestMap.set(doc.id, {
            name: doc.data()?.name || (Array.isArray(doc.data()?.fields) ? doc.data()?.fields.join("、") : "未知委托"),
            fields: doc.data()?.fields || [],
          });
        }
      });
      
      const volunteerMap = new Map();
      volunteerDocs.forEach((doc) => {
        if (doc.exists) {
          volunteerMap.set(doc.id, {
            name: doc.data()?.displayName || doc.data()?.email || "未知義工",
            email: doc.data()?.email || "",
          });
        }
      });
      
      data = snapshot.docs.map((doc: any) => {
        const docData = doc.data();
        const requestInfo = requestMap.get(docData.requestId) || { name: "未知委托", fields: [] };
        const volunteerInfo = volunteerMap.get(docData.volunteerId) || { name: "未知義工", email: "" };
        
        return {
          id: doc.id,
          ...docData,
          createdAt: docData.createdAt?.toDate(),
          updatedAt: docData.updatedAt?.toDate(),
          matchedAt: docData.matchedAt?.toDate(),
          completedAt: docData.completedAt?.toDate(),
          requestName: requestInfo.name,
          requestFields: requestInfo.fields,
          volunteerName: volunteerInfo.name,
          volunteerEmail: volunteerInfo.email,
        };
      });
      
      // 日期篩選
      if (startDate || endDate) {
        data = data.filter((item) => {
          const itemDate = item.createdAt;
          if (!itemDate) return false;
          
          if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (itemDate < start) return false;
          }
          
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (itemDate > end) return false;
          }
          
          return true;
        });
      }
      
      // 排序
      data.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    }

    return NextResponse.json({ data, count: data.length });
  } catch (error: any) {
    console.error("Error exporting data:", error);
    return NextResponse.json(
      { error: error.message || "匯出數據失敗" },
      { status: 500 }
    );
  }
}
