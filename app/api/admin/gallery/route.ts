import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const decoded = await verifyAdmin(request);
    if (!decoded) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const adminDb = getAdminDb();
    const snapshot = await adminDb.collection("requests").where("status", "==", "completed").get();

    const items = snapshot.docs.map((doc) => {
      const data = doc.data() || {};
      const galleryPhotos = Array.isArray(data.galleryPhotos)
        ? data.galleryPhotos.map((photo: any) => ({
            ...photo,
            uploadedAt: photo.uploadedAt?.toDate?.()?.toISOString() || photo.uploadedAt,
          }))
        : [];
      const galleryFeedbacks = Array.isArray(data.galleryFeedbacks)
        ? data.galleryFeedbacks.map((feedback: any) => ({
            ...feedback,
            createdAt: feedback.createdAt?.toDate?.()?.toISOString() || feedback.createdAt,
          }))
        : [];

      return {
        id: doc.id,
        name: data.name || "",
        fields: Array.isArray(data.fields) ? data.fields : [],
        description: data.description || "",
        isPublicGallery: !!data.isPublicGallery,
        completedAt: data.completedAt?.toDate?.()?.toISOString() || null,
        galleryPhotos,
        galleryFeedbacks,
      };
    });

    items.sort((a, b) => {
      const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return bTime - aTime;
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("Error fetching admin gallery:", error);
    return NextResponse.json(
      { error: error.message || "獲取 Gallery 管理資料失敗" },
      { status: 500 }
    );
  }
}

