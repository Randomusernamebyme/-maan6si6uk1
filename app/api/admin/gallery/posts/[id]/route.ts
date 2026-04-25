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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await verifyAdmin(request);
    if (!decoded) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "缺少貼文 ID" }, { status: 400 });
    }

    const adminDb = getAdminDb();
    const doc = await adminDb.collection("galleryPosts").doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: "找不到貼文" }, { status: 404 });
    }

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

    return NextResponse.json({
      item: {
        id: doc.id,
        name: data.name || "",
        fields: Array.isArray(data.fields) ? data.fields : [],
        description: data.description || "",
        isPublic: !!data.isPublic,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        publishedAt: data.publishedAt?.toDate?.()?.toISOString() || null,
        photos,
        feedbacks,
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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await verifyAdmin(request);
    if (!decoded) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "缺少貼文 ID" }, { status: 400 });
    }

    const payload = await request.json().catch(() => ({}));
    const adminDb = getAdminDb();
    const ref = adminDb.collection("galleryPosts").doc(id);
    const existing = await ref.get();
    if (!existing.exists) {
      return NextResponse.json({ error: "找不到貼文" }, { status: 404 });
    }

    const update: Record<string, any> = {
      updatedAt: new Date(),
      updatedBy: decoded.uid,
    };

    if (payload?.name !== undefined) update.name = String(payload.name || "").trim();
    if (payload?.description !== undefined) update.description = String(payload.description || "").trim();
    if (payload?.fields !== undefined) {
      update.fields = Array.isArray(payload.fields) ? payload.fields.filter(Boolean).map(String) : [];
    }
    if (payload?.isPublic !== undefined) {
      const next = !!payload.isPublic;
      update.isPublic = next;
      if (next) {
        update.publishedAt = existing.data()?.publishedAt || new Date();
      }
    }
    if (payload?.photos !== undefined) update.photos = Array.isArray(payload.photos) ? payload.photos : [];
    if (payload?.feedbacks !== undefined) update.feedbacks = Array.isArray(payload.feedbacks) ? payload.feedbacks : [];

    await ref.update(update);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error updating gallery post:", error);
    return NextResponse.json(
      { error: error.message || "更新貼文失敗" },
      { status: 500 }
    );
  }
}

