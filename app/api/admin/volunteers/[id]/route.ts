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

    // 更新文檔
    await userRef.update({
      ...body,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating volunteer:", error);
    return NextResponse.json(
      { error: error.message || "更新義工資料失敗" },
      { status: 500 }
    );
  }
}

