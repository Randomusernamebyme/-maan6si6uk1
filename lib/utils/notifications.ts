import { getAdminDb } from "@/lib/firebase/admin";
import { Notification } from "@/types";

/**
 * 創建通知的輔助函數
 * 使用 Admin SDK，可以在服務器端調用
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: Notification["type"],
  options?: {
    relatedRequestId?: string;
    relatedApplicationId?: string;
  }
): Promise<string> {
  const adminDb = getAdminDb();

  const notificationData: Omit<Notification, "id"> = {
    userId,
    title,
    message,
    type,
    relatedRequestId: options?.relatedRequestId,
    relatedApplicationId: options?.relatedApplicationId,
    read: false,
    createdAt: new Date(),
  };

  const docRef = await adminDb.collection("notifications").add(notificationData);
  return docRef.id;
}

/**
 * 批量創建通知
 */
export async function createNotifications(
  notifications: Array<{
    userId: string;
    title: string;
    message: string;
    type: Notification["type"];
    relatedRequestId?: string;
    relatedApplicationId?: string;
  }>
): Promise<string[]> {
  const adminDb = getAdminDb();
  const batch = adminDb.batch();
  const ids: string[] = [];

  notifications.forEach((notification) => {
    const docRef = adminDb.collection("notifications").doc();
    ids.push(docRef.id);
    
    batch.set(docRef, {
      ...notification,
      read: false,
      createdAt: new Date(),
    });
  });

  await batch.commit();
  return ids;
}
