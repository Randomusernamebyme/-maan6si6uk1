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
    const snapshot = await adminDb.collection("galleryPosts").orderBy("createdAt", "desc").get();

    const items = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data() || {};
        const rawPhotos = Array.isArray(data.photos)
          ? data.photos.map((photo: any) => ({
              ...photo,
              uploadedAt: photo.uploadedAt?.toDate?.()?.toISOString() || photo.uploadedAt,
            }))
          : [];
        const photos = await normalizeGalleryPhotos(rawPhotos);
        const feedbacks = Array.isArray(data.feedbacks)
          ? data.feedbacks.map((feedback: any) => ({
              ...feedback,
              createdAt: feedback.createdAt?.toDate?.()?.toISOString() || feedback.createdAt,
            }))
          : [];

        return {
          id: doc.id,
          name: data.name || "",
          fields: Array.isArray(data.fields) ? data.fields : [],
          description: data.description || "",
          isPublic: !!data.isPublic,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
          publishedAt: data.publishedAt?.toDate?.()?.toISOString() || null,
          photos,
          feedbacks,
        };
      })
    );

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("Error fetching gallery posts:", error);
    return NextResponse.json(
      { error: error.message || "獲取花絮貼文失敗" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = await verifyAdmin(request);
    if (!decoded) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const payload = await request.json().catch(() => ({}));
    const name = String(payload?.name || "").trim();
    const description = String(payload?.description || "").trim();
    const fields = Array.isArray(payload?.fields) ? payload.fields.filter(Boolean).map(String) : [];

    const adminDb = getAdminDb();
    const now = new Date();
    const ref = await adminDb.collection("galleryPosts").add({
      name,
      description,
      fields,
      isPublic: false,
      photos: [],
      feedbacks: [],
      createdAt: now,
      updatedAt: now,
      createdBy: decoded.uid,
      updatedBy: decoded.uid,
    });

    return NextResponse.json({ id: ref.id });
  } catch (error: any) {
    console.error("Error creating gallery post:", error);
    return NextResponse.json(
      { error: error.message || "新增花絮貼文失敗" },
      { status: 500 }
    );
  }
}

