"use client";

import { useState, useEffect } from "react";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { NotificationCard } from "@/components/notifications/NotificationCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAuthToken } from "@/lib/utils/auth";
import { CheckCheck } from "lucide-react";

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const notificationsPerPage = 15;
  const { notifications, loading, error } = useNotifications({
    read: filter === "all" ? undefined : filter === "read",
  });

  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

  // 當標籤/篩選改變時，回到第一頁
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error("請先登入");
      }

      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error("請先登入");
      }

      await fetch("/api/notifications/read-all", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay message={error.message || "載入通知失敗"} />;
  }

  const filteredNotifications =
    filter === "all"
      ? notifications
      : filter === "unread"
      ? unreadNotifications
      : readNotifications;

  const totalPages = Math.ceil(filteredNotifications.length / notificationsPerPage);
  const startIndex = (currentPage - 1) * notificationsPerPage;
  const endIndex = startIndex + notificationsPerPage;
  const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">通知</h1>
          <p className="text-muted-foreground mt-1">
            共 {notifications.length} 條通知，{unreadNotifications.length} 條未讀
            {filteredNotifications.length > notificationsPerPage && (
              <span className="ml-2">
                （第 {startIndex + 1}-{Math.min(endIndex, filteredNotifications.length)} 條，共{" "}
                {totalPages} 頁）
              </span>
            )}
          </p>
        </div>
        {unreadNotifications.length > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
            <CheckCheck className="mr-2 h-4 w-4" />
            全部標記為已讀
          </Button>
        )}
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">全部 ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">未讀 ({unreadNotifications.length})</TabsTrigger>
          <TabsTrigger value="read">已讀 ({readNotifications.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-center">
                  {filter === "all"
                    ? "目前沒有通知"
                    : filter === "unread"
                    ? "沒有未讀通知"
                    : "沒有已讀通知"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {paginatedNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    顯示第 {startIndex + 1}-{Math.min(endIndex, filteredNotifications.length)} 條，
                    共 {filteredNotifications.length} 條
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      上一頁
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          // 顯示當前頁、第一頁、最後一頁，以及當前頁前後各一頁
                          return (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          );
                        })
                        .map((page, index, array) => {
                          const showEllipsisBefore = index > 0 && array[index - 1] < page - 1;
                          return (
                            <div key={page} className="flex items-center gap-1">
                              {showEllipsisBefore && (
                                <span className="px-2 text-muted-foreground">...</span>
                              )}
                              <Button
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className="min-w-[2.5rem]"
                              >
                                {page}
                              </Button>
                            </div>
                          );
                        })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      下一頁
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
