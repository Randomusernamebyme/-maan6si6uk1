import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "@/lib/firebase/admin";

// 驗證用戶 token
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
    
    // 驗證用戶 ID 匹配
    if (applicationData?.volunteerId !== decodedToken.uid) {
      return NextResponse.json(
        { error: "無權限" },
        { status: 403 }
      );
    }

    // 只能撤回待處理狀態的報名
    if (applicationData?.status !== "pending") {
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

