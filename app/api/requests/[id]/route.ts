import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/firebase/auth-server"
import { adminDb } from "@/lib/firebase/admin"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getServerSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const doc = await adminDb.collection("requests").doc(params.id).get()
    if (!doc.exists) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    const requestData = { id: doc.id, ...doc.data() }

    // 如果不是管理員，隱藏委托者詳細資訊
    if (user.role !== "admin") {
      requestData.requester = {
        name: "***",
        phone: "***",
        age: "***",
        district: "***",
      }
    }

    return NextResponse.json(requestData)
  } catch (error) {
    console.error("Error fetching request:", error)
    return NextResponse.json(
      { error: "Failed to fetch request" },
      { status: 500 }
    )
  }
}

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
    await adminDb.collection("requests").doc(params.id).update({
      ...data,
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating request:", error)
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getServerSession()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await adminDb.collection("requests").doc(params.id).delete()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting request:", error)
    return NextResponse.json(
      { error: "Failed to delete request" },
      { status: 500 }
    )
  }
}

