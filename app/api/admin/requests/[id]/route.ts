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
    return NextResponse.json({
      id: requestDoc.id,
      ...requestData,
      createdAt: requestData?.createdAt?.toDate?.()?.toISOString(),
      updatedAt: requestData?.updatedAt?.toDate?.()?.toISOString(),
    });
  } catch (error: any) {
    console.error("Error fetching request:", error);
    return NextResponse.json(
      { error: error.message || "獲取委托失敗" },
      { status: 500 }
    );
  }
}

// PATCH: 更新委托狀態
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
    const requestId = params.id;
    const adminDb = getAdminDb();
    const requestRef = adminDb.collection("requests").doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      return NextResponse.json(
        { error: "委托不存在" },
        { status: 404 }
      );
    }

    const oldRequestData = requestDoc.data();
    const updateData: any = {
      ...body,
      updatedAt: new Date(),
    };

    // 如果狀態改為 completed，設置 completedAt
    if (body.status === "completed" && oldRequestData?.status !== "completed") {
      updateData.completedAt = new Date();

      // 同步更新所有相關的 approved 申請狀態為 completed
      const applicationsSnapshot = await adminDb
        .collection("applications")
        .where("requestId", "==", requestId)
        .where("status", "==", "approved")
        .get();

      const batch = adminDb.batch();
      applicationsSnapshot.docs.forEach((appDoc) => {
        batch.update(appDoc.ref, {
          status: "completed",
          completedAt: new Date(),
          updatedAt: new Date(),
        });
      });
      await batch.commit();
    }

    // 如果狀態改為 cancelled，同步更新所有相關的 approved 申請狀態
    if (body.status === "cancelled" && oldRequestData?.status !== "cancelled") {
      const applicationsSnapshot = await adminDb
        .collection("applications")
        .where("requestId", "==", requestId)
        .where("status", "==", "approved")
        .get();

      const batch = adminDb.batch();
      applicationsSnapshot.docs.forEach((appDoc) => {
        batch.update(appDoc.ref, {
          status: "rejected", // 取消的委托，申請狀態改為 rejected
          updatedAt: new Date(),
        });
      });
      await batch.commit();
    }

    await requestRef.update(updateData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating request:", error);
    return NextResponse.json(
      { error: error.message || "更新委托失敗" },
      { status: 500 }
    );
  }
}
