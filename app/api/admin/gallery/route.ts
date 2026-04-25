import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { normalizeGalleryPhotos } from "@/lib/firebase/gallery-urls";

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
    const requestSnapshot = await adminDb
      .collection("requests")
      .where("status", "in", ["open", "published", "matched", "in-progress", "completed"])
      .get();
    const postSnapshot = await adminDb.collection("galleryPosts").get();

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
        isPublicGallery: !!data.isPublicGallery,
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
        isPublicGallery: !!data.isPublic,
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
    console.error("Error fetching admin gallery:", error);
    return NextResponse.json(
      { error: error.message || "獲取展覽管理資料失敗" },
      { status: 500 }
    );
  }
}

