import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/firebase/auth-server"
import { adminDb } from "@/lib/firebase/admin"
import { Request } from "@/types"

export async function GET(request: NextRequest) {
  try {
    const user = await getServerSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const status = request.nextUrl.searchParams.get("status")
    let query = adminDb.collection("requests").orderBy("createdAt", "desc")

    if (status) {
      query = query.where("status", "==", status) as any
    }

    const snapshot = await query.get()
    const requests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Request[]

    // 如果不是管理員，隱藏委托者詳細資訊
    if (user.role !== "admin") {
      requests.forEach((req) => {
        req.requester = {
          name: "***",
          phone: "***",
          age: "***",
          district: "***",
        }
      })
    }

    return NextResponse.json(requests)
  } catch (error) {
    console.error("Error fetching requests:", error)
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerSession()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const newRequestRef = adminDb.collection("requests").doc()
    
    await newRequestRef.set({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ id: newRequestRef.id })
  } catch (error) {
    console.error("Error creating request:", error)
    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 }
    )
  }
}

