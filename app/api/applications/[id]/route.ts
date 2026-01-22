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

    // 刪除報名記錄
    await applicationRef.delete();

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

    await applicationRef.update({
      ...body,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: error.message || "更新失敗，請稍後再試" },
      { status: 500 }
    );
  }
}
