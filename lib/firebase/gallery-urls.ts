import { getStorage } from "firebase-admin/storage";
import { getAdminApp } from "@/lib/firebase/admin";

function extractObjectPath(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("firebasestorage.googleapis.com")) {
      return null;
    }

    const nameParam = parsed.searchParams.get("name");
    if (nameParam) {
      return decodeURIComponent(nameParam);
    }

    const match = parsed.pathname.match(/\/o\/(.+)$/);
    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }

    return null;
  } catch {
    return null;
  }
}

async function toReadableUrl(url: string): Promise<string> {
  const objectPath = extractObjectPath(url);
  if (!objectPath) {
    return url;
  }

  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucketName) {
    return url;
  }

  try {
    const bucket = getStorage(getAdminApp()).bucket(bucketName);
    const [signedUrl] = await bucket.file(objectPath).getSignedUrl({
      action: "read",
      expires: "2500-01-01",
    });
    return signedUrl;
  } catch {
    return url;
  }
}

export async function normalizeGalleryPhotos<T extends { url: string }>(photos: T[]): Promise<T[]> {
  return Promise.all(
    photos.map(async (photo) => ({
      ...photo,
      url: await toReadableUrl(photo.url),
    }))
  );
}
