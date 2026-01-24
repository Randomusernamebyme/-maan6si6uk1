"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { LoadingPage } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationCard } from "@/components/notifications/NotificationCard";
import { getAuthToken } from "@/lib/utils/auth";
import { Notification } from "@/types";

export default function NotificationsPage() {
  const { user } = useRequireAuth("volunteer");
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);

  const { notifications, unreadCount, loading, error } = useNotifications(
    user?.uid || null,
    {
      read: filter === "all" ? null : filter === "unread" ? false : true,
    }
  );

  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    try {
      setMarkingAsRead(notificationId);
      const token = await getAuthToken();
      if (!token) {
        throw new Error("請先登入");
      }

      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ read: true }),
      });

      if (!response.ok) {
        throw new Error("標記為已讀失敗");
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    } finally {
      setMarkingAsRead(null);
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error("請先登入");
      }

      const response = await fetch("/api/notifications/read-all", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("標記所有為已讀失敗");
      }
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  }, []);

  if (loading) {
    return <LoadingPage />;
  }

  if (error) {
    return <ErrorDisplay message="載入通知時發生錯誤" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">通知中心</h1>
          <p className="text-muted-foreground">
            您有 {unreadCount} 條未讀通知
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline">
            標記全部為已讀
          </Button>
        )}
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">
            全部 ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            未讀 ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="read">
            已讀 ({notifications.length - unreadCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {filter === "unread"
                    ? "沒有未讀通知"
                    : filter === "read"
                    ? "沒有已讀通知"
                    : "暫無通知"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
