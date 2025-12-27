import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { Request } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 驗證必要欄位
    if (
      !body.requester?.name ||
      !body.requester?.phone ||
      !body.requester?.age ||
      !body.requester?.district ||
      !body.description ||
      !body.fields ||
      body.fields.length === 0
    ) {
      return NextResponse.json(
        { error: "缺少必要欄位" },
        { status: 400 }
      );
    }

    // 創建委托文檔
    const requestData: Omit<Request, "id" | "createdAt" | "updatedAt"> = {
      requester: {
        name: body.requester.name,
        phone: body.requester.phone,
        age: body.requester.age,
        district: body.requester.district,
      },
      description: body.description,
      fields: body.fields,
      appreciation: body.appreciation,
      status: "pending",
    };

    const adminDb = getAdminDb();
    const docRef = await adminDb.collection("requests").add({
      ...requestData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 生成追蹤編號（使用文檔ID的前8位字符）
    const trackingNumber = docRef.id.substring(0, 8).toUpperCase();

    return NextResponse.json(
      { success: true, id: docRef.id, trackingNumber },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error submitting request:", error);
    return NextResponse.json(
      { error: error.message || "提交失敗，請稍後再試" },
      { status: 500 }
    );
  }
}

