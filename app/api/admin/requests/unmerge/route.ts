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
  } catch {
    return null;
  }
}

// POST: 解除合併（單一子委托）
export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifyAdmin(request);
    if (!decodedToken) {
      return NextResponse.json(
        { error: "未授權，需要管理員權限" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { childRequestId } = body;

    if (!childRequestId) {
      return NextResponse.json(
        { error: "缺少必要參數 childRequestId" },
        { status: 400 }
      );
    }

    const adminDb = getAdminDb();

    // 讀取子委托
    const childRef = adminDb.collection("requests").doc(childRequestId);
    const childSnap = await childRef.get();
    if (!childSnap.exists) {
      return NextResponse.json(
        { error: "子委托不存在" },
        { status: 404 }
      );
    }

    const childData = childSnap.data() || {};
    const mainRequestId = childData.mergedIntoId as string | undefined;

    if (!mainRequestId) {
      // 若沒有 mergedIntoId，代表目前不在合併狀態，直接返回成功
      return NextResponse.json({ success: true, message: "此委托目前沒有合併關係" });
    }

    // 讀取主委托
    const mainRef = adminDb.collection("requests").doc(mainRequestId);
    const mainSnap = await mainRef.get();
    if (!mainSnap.exists) {
      // 主委托不存在時，仍然嘗試把子委托從合併狀態還原
      await childRef.update({
        isMerged: false,
        mergedIntoId: null,
        updatedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: "主委托不存在，已將子委托從合併狀態還原",
      });
    }

    const mainData = mainSnap.data() || {};
    const existingChildren: string[] = Array.isArray(mainData.mergedChildrenIds)
      ? mainData.mergedChildrenIds
      : [];

    const updatedChildren = existingChildren.filter((id) => id !== childRequestId);

    // 使用 batch 同步更新主委托與子委托
    const batch = adminDb.batch();
    batch.update(mainRef, {
      mergedChildrenIds: updatedChildren,
      updatedAt: new Date(),
    });
    batch.update(childRef, {
      isMerged: false,
      mergedIntoId: null,
      updatedAt: new Date(),
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      mainRequestId,
      childRequestId,
      mergedChildrenIds: updatedChildren,
    });
  } catch (error: any) {
    console.error("Error unmerging request:", error);
    return NextResponse.json(
      { error: error.message || "解除合併失敗" },
      { status: 500 }
    );
  }
}

