"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot, limit as firestoreLimit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Notification } from "@/types";
import { convertTimestamp } from "@/lib/firebase/firestore";
import { getAuthToken } from "@/lib/utils/auth";

export function useNotifications(
  userId: string | null,
  options?: {
    read?: boolean | null; // true = 只讀已讀, false = 只讀未讀, null = 全部
    type?: Notification["type"];
    limit?: number;
  }
) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // 先嘗試使用 Firestore 實時監聽
    // 注意：為了避免需要複合索引，我們只查詢 userId，然後在內存中過濾 read 狀態
    try {
      let q: any = query(
        collection(db, "notifications"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );

      // 如果指定了 limit，應用 limit（但不在查詢中過濾 read，避免需要複合索引）
      if (options?.limit) {
        q = query(q, firestoreLimit(options.limit * 2)); // 獲取更多以確保有足夠的結果
      }

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const allNotifications: Notification[] = [];
          let unread = 0;

          snapshot.forEach((doc) => {
            const docData = doc.data();
            const notification: Notification = {
              id: doc.id,
              userId: docData.userId,
              title: docData.title,
              message: docData.message,
              type: docData.type,
              relatedRequestId: docData.relatedRequestId,
              relatedApplicationId: docData.relatedApplicationId,
              read: docData.read || false,
              readAt: docData.readAt ? convertTimestamp(docData.readAt) : undefined,
              createdAt: convertTimestamp(docData.createdAt),
            };

            // 在內存中過濾 read 狀態
            if (options?.read !== null && options?.read !== undefined) {
              if (notification.read !== options.read) {
                return; // 跳過不符合條件的通知
              }
            }

            // 類型篩選（在內存中）
            if (!options?.type || notification.type === options.type) {
              allNotifications.push(notification);
            }

            if (!notification.read) {
              unread++;
            }
          });

          // 如果指定了 limit，應用 limit
          const finalNotifications = options?.limit
            ? allNotifications.slice(0, options.limit)
            : allNotifications;

          setNotifications(finalNotifications);
          setUnreadCount(unread);
          setLoading(false);
        },
        async (err: any) => {
          // 如果權限不足，使用 API 獲取
          if (err?.code === "permission-denied" || err?.code === "PERMISSION_DENIED") {
            try {
              const token = await getAuthToken();
              if (!token) {
                throw new Error("請先登入");
              }

              const params = new URLSearchParams();
              if (options?.read !== null && options?.read !== undefined) {
                params.append("read", options.read.toString());
              }
              if (options?.type) {
                params.append("type", options.type);
              }
              if (options?.limit) {
                params.append("limit", options.limit.toString());
              }

              const response = await fetch(`/api/notifications?${params.toString()}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (response.ok) {
                const data = await response.json();
                setNotifications(
                  data.notifications.map((n: any) => ({
                    ...n,
                    createdAt: n.createdAt ? new Date(n.createdAt) : new Date(),
                    readAt: n.readAt ? new Date(n.readAt) : undefined,
                  }))
                );
                setUnreadCount(data.unreadCount || 0);
              } else {
                throw new Error("獲取通知失敗");
              }
            } catch (apiErr) {
              console.error("Error fetching notifications via API:", apiErr);
              setError(apiErr as Error);
            }
          } else {
            console.error("Error fetching notifications:", err);
            setError(err as Error);
          }
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up notifications listener:", err);
      setError(err as Error);
      setLoading(false);
    }
  }, [userId, options?.read, options?.type, options?.limit]);

  return { notifications, unreadCount, loading, error };
}
