import { getAdminDb } from "@/lib/firebase/admin";
import { Notification } from "@/types";

/**
 * 創建單個通知
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: "info" | "success" | "warning" | "error",
  options?: {
    relatedRequestId?: string;
    relatedApplicationId?: string;
  }
): Promise<void> {
  try {
    const adminDb = getAdminDb();
    await adminDb.collection("notifications").add({
      userId,
      title,
      message,
      type,
      relatedRequestId: options?.relatedRequestId || null,
      relatedApplicationId: options?.relatedApplicationId || null,
      read: false,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    // 不拋出錯誤，避免影響主要操作
  }
}

/**
 * 批量創建通知
 */
export async function createNotifications(
  notifications: Array<{
    userId: string;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    relatedRequestId?: string;
    relatedApplicationId?: string;
  }>
): Promise<void> {
  try {
    const adminDb = getAdminDb();
    const batch = adminDb.batch();
    
    notifications.forEach((notification) => {
      const notificationRef = adminDb.collection("notifications").doc();
      batch.set(notificationRef, {
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        relatedRequestId: notification.relatedRequestId || null,
        relatedApplicationId: notification.relatedApplicationId || null,
        read: false,
        createdAt: new Date(),
      });
    });
    
    await batch.commit();
  } catch (error) {
    console.error("Error creating notifications:", error);
    // 不拋出錯誤，避免影響主要操作
  }
}
