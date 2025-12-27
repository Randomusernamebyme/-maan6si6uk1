import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/firebase/auth-server"
import { adminDb } from "@/lib/firebase/admin"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getServerSession()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    await adminDb.collection("applications").doc(params.id).update({
      ...data,
      updatedAt: new Date(),
    })

    // 如果接受報名，更新對應的委托狀態
    if (data.status === "accepted") {
      const appDoc = await adminDb.collection("applications").doc(params.id).get()
      const appData = appDoc.data()
      if (appData?.requestId) {
        await adminDb.collection("requests").doc(appData.requestId).update({
          status: "matched",
          assignedVolunteerId: appData.volunteerId,
          updatedAt: new Date(),
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating application:", error)
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    )
  }
}

