import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";

    if (!phone) {
      return NextResponse.json(
        { error: "缺少電話號碼" },
        { status: 400 }
      );
    }

    const adminDb = getAdminDb();
    const snapshot = await adminDb
      .collection("users")
      .where("phone", "==", phone)
      .limit(1)
      .get();

    return NextResponse.json({ exists: !snapshot.empty });
  } catch (error: any) {
    console.error("Error checking phone uniqueness:", error);
    return NextResponse.json(
      { error: error?.message || "電話檢查失敗，請稍後再試" },
      { status: 500 }
    );
  }
}

