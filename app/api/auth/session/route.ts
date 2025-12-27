import { NextRequest, NextResponse } from "next/server"
import { adminAuth } from "@/lib/firebase/admin"

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json()

    // 驗證 ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    
    // 創建 session cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    })

    const response = NextResponse.json({ success: true })
    response.cookies.set("session", sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })

    return response
  } catch (error) {
    console.error("Session creation error:", error)
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 401 }
    )
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete("session")
  return response
}

