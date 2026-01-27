"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Notification } from "@/types";
import { convertTimestamp } from "@/lib/firebase/firestore";
import { useAuth } from "./useAuth";

interface UseNotificationsOptions {
  read?: boolean;
  type?: "info" | "success" | "warning" | "error";
  limit?: number;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    // 嘗試使用 Firestore 實時監聽
    try {
      let q = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      // 如果指定了 read 篩選
      if (options.read !== undefined) {
        q = query(
          collection(db, "notifications"),
          where("userId", "==", user.uid),
          where("read", "==", options.read),
          orderBy("createdAt", "desc")
        );
      }

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          try {
            let data = snapshot.docs.map((doc) => {
              const docData = doc.data();
              return {
                id: doc.id,
                ...docData,
                createdAt: convertTimestamp(docData.createdAt) || new Date(),
                readAt: docData.readAt ? convertTimestamp(docData.readAt) : undefined,
              } as Notification;
            });

            // 如果指定了 type 篩選
            if (options.type) {
              data = data.filter((n) => n.type === options.type);
            }

            // 如果指定了 limit
            if (options.limit) {
              data = data.slice(0, options.limit);
            }

            setNotifications(data);
            setLoading(false);
            setError(null);
          } catch (err) {
            console.error("Error processing notifications data:", err);
            setError(err as Error);
            setLoading(false);
          }
        },
        (err) => {
          console.error("Error fetching notifications:", err);
          // 如果權限不足，回退到 API 輪詢
          setError(err as Error);
          fetchNotificationsFromAPI();
        }
      );

      return () => unsubscribe();
    } catch (err) {
      // 如果查詢失敗（可能是因為缺少索引），回退到 API 輪詢
      console.error("Error setting up notifications listener:", err);
      fetchNotificationsFromAPI();
    }

    // API 輪詢回退
    function fetchNotificationsFromAPI() {
      const fetchData = async () => {
        try {
          const token = await import("@/lib/utils/auth").then((m) => m.getAuthToken());
          if (!token) {
            setLoading(false);
            return;
          }

          const params = new URLSearchParams();
          if (options.read !== undefined) {
            params.append("read", String(options.read));
          }
          if (options.type) {
            params.append("type", options.type);
          }
          if (options.limit) {
            params.append("limit", String(options.limit));
          }

          const response = await fetch(`/api/notifications?${params.toString()}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error("獲取通知失敗");
          }

          const data = await response.json();
          setNotifications(data);
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error("Error fetching notifications from API:", err);
          setError(err as Error);
          setLoading(false);
        }
      };

      fetchData();
      // 每 30 秒輪詢一次
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.uid, options.read, options.type, options.limit]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, loading, error, unreadCount };
}
