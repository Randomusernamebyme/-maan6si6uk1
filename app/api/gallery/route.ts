import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

export async function GET() {
  try {
    const adminDb = getAdminDb();
    const snapshot = await adminDb
      .collection("requests")
      .where("status", "==", "completed")
      .where("isPublicGallery", "==", true)
      .get();

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
    console.error("Error fetching gallery:", error);
    return NextResponse.json(
      { error: error.message || "獲取 Gallery 失敗" },
      { status: 500 }
    );
  }
}

