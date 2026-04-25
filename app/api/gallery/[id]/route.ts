import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { normalizeGalleryPhotos } from "@/lib/firebase/gallery-urls";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "缺少貼文 ID" }, { status: 400 });
    }

    const adminDb = getAdminDb();
    const requestDoc = await adminDb.collection("requests").doc(id).get();
    if (requestDoc.exists) {
      const data = requestDoc.data() || {};
      const allowed = ["published", "matched", "in-progress", "completed"];
      if (!allowed.includes(data.status) || data.isPublicGallery !== true) {
        return NextResponse.json({ error: "貼文未公開" }, { status: 404 });
      }

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

      const item = {
        kind: "request" as const,
        id: requestDoc.id,
        name: data.name || "",
        fields: Array.isArray(data.fields) ? data.fields : [],
        description: data.description || "",
        completedAt: data.completedAt?.toDate?.()?.toISOString() || null,
        galleryPhotos,
        galleryFeedbacks,
      };

      return NextResponse.json({ item });
    }

    const postDoc = await adminDb.collection("galleryPosts").doc(id).get();
    if (!postDoc.exists) {
      return NextResponse.json({ error: "找不到貼文" }, { status: 404 });
    }
    const data = postDoc.data() || {};
    if (data.isPublic !== true) {
      return NextResponse.json({ error: "貼文未公開" }, { status: 404 });
    }

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

    return NextResponse.json({
      item: {
        kind: "post" as const,
        id: postDoc.id,
        name: data.name || "",
        fields: Array.isArray(data.fields) ? data.fields : [],
        description: data.description || "",
        completedAt: publishedAt || createdAt,
        galleryPhotos,
        galleryFeedbacks,
      },
    });
  } catch (error: any) {
    console.error("Error fetching gallery post:", error);
    return NextResponse.json(
      { error: error.message || "獲取貼文失敗" },
      { status: 500 }
    );
  }
}
