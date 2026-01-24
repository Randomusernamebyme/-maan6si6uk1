import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/config";

/**
 * 獲取 Firebase Storage 文件的公開下載 URL
 * @param path 文件路徑，例如 "service-fields/1.png"
 * @returns 公開下載 URL
 */
export async function getStorageDownloadURL(path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error("Error getting download URL:", error);
    throw error;
  }
}

/**
 * 批量獲取 Firebase Storage 文件的公開下載 URL
 * @param paths 文件路徑數組
 * @returns 路徑到 URL 的映射
 */
export async function getStorageDownloadURLs(
  paths: string[]
): Promise<Record<string, string>> {
  try {
    const urlPromises = paths.map(async (path) => {
      const storageRef = ref(storage, path);
      const url = await getDownloadURL(storageRef);
      return { path, url };
    });

    const results = await Promise.all(urlPromises);
    return results.reduce((acc, { path, url }) => {
      acc[path] = url;
      return acc;
    }, {} as Record<string, string>);
  } catch (error) {
    console.error("Error getting download URLs:", error);
    throw error;
  }
}
