import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/firebase/auth-server"
import { adminDb } from "@/lib/firebase/admin"

export async function GET(request: NextRequest) {
  try {
    const user = await getServerSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const requestId = request.nextUrl.searchParams.get("requestId")
    const volunteerId = request.nextUrl.searchParams.get("volunteerId")

    let query: any = adminDb.collection("applications")

    if (requestId) {
      query = query.where("requestId", "==", requestId)
    }
    if (volunteerId) {
      query = query.where("volunteerId", "==", volunteerId)
    }

    // 如果不是管理員，只能查看自己的報名
    if (user.role !== "admin" && !volunteerId) {
      query = query.where("volunteerId", "==", user.uid)
    }

    const snapshot = await query.orderBy("createdAt", "desc").get()
    const applications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json(applications)
  } catch (error) {
    console.error("Error fetching applications:", error)
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerSession()
    if (!user || user.role !== "volunteer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const newApplicationRef = adminDb.collection("applications").doc()
    
    await newApplicationRef.set({
      ...data,
      volunteerId: user.uid,
      volunteerName: user.displayName,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ id: newApplicationRef.id })
  } catch (error) {
    console.error("Error creating application:", error)
    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 }
    )
  }
}

