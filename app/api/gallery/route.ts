import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { normalizeGalleryPhotos } from "@/lib/firebase/gallery-urls";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const adminDb = getAdminDb();
    const requestSnapshot = await adminDb
      .collection("requests")
      .where("status", "==", "completed")
      .where("isPublicGallery", "==", true)
      .get();

    const postSnapshot = await adminDb
      .collection("galleryPosts")
      .where("isPublic", "==", true)
      .get();

    const requestItems = await Promise.all(requestSnapshot.docs.map(async (doc) => {
      const data = doc.data() || {};
      const rawGalleryPhotos = Array.isArray(data.galleryPhotos)
        ? data.galleryPhotos.map((photo: any) => ({
            ...photo,
            uploadedAt: photo.uploadedAt?.toDate?.()?.toISOString() || photo.uploadedAt,
          }))
        : [];
      const galleryPhotos = await normalizeGalleryPhotos(rawGalleryPhotos);
      const galleryFeedbacks = Array.isArray(data.galleryFeedbacks)
        ? data.galleryFeedbacks.map((feedback: any) => ({
            ...feedback,
            createdAt: feedback.createdAt?.toDate?.()?.toISOString() || feedback.createdAt,
          }))
        : [];

      return {
        kind: "request" as const,
        id: doc.id,
        name: data.name || "",
        fields: Array.isArray(data.fields) ? data.fields : [],
        description: data.description || "",
        completedAt: data.completedAt?.toDate?.()?.toISOString() || null,
        galleryPhotos,
        galleryFeedbacks,
      };
    }));

    const postItems = await Promise.all(postSnapshot.docs.map(async (doc) => {
      const data = doc.data() || {};
      const rawPhotos = Array.isArray(data.photos)
        ? data.photos.map((photo: any) => ({
            ...photo,
            uploadedAt: photo.uploadedAt?.toDate?.()?.toISOString() || photo.uploadedAt,
          }))
        : [];
      const galleryPhotos = await normalizeGalleryPhotos(rawPhotos);
      const galleryFeedbacks = Array.isArray(data.feedbacks)
        ? data.feedbacks.map((feedback: any) => ({
            ...feedback,
            createdAt: feedback.createdAt?.toDate?.()?.toISOString() || feedback.createdAt,
          }))
        : [];

      const publishedAt = data.publishedAt?.toDate?.()?.toISOString() || null;
      const createdAt = data.createdAt?.toDate?.()?.toISOString() || null;

      return {
        kind: "post" as const,
        id: doc.id,
        name: data.name || "",
        fields: Array.isArray(data.fields) ? data.fields : [],
        description: data.description || "",
        completedAt: publishedAt || createdAt,
        galleryPhotos,
        galleryFeedbacks,
      };
    }));

    const items = [...requestItems, ...postItems];

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

