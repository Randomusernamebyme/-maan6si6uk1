"use client";

import { Notification } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import Link from "next/link";
import { CheckCircle2, Info, AlertCircle, XCircle } from "lucide-react";

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
}

const typeIcons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
  error: XCircle,
};

const typeColors = {
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function NotificationCard({ notification, onMarkAsRead }: NotificationCardProps) {
  const Icon = typeIcons[notification.type];
  const typeColor = typeColors[notification.type];

  const formatDate = (date: Date) => {
    return format(date, "yyyy年MM月dd日 HH:mm", { locale: zhTW });
  };

  // 確定跳轉鏈接
  let linkHref: string | null = null;
  if (notification.relatedRequestId) {
    linkHref = `/volunteer/requests/${notification.relatedRequestId}`;
  } else if (notification.relatedApplicationId) {
    linkHref = `/volunteer/applications`;
  }

  const cardContent = (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        !notification.read ? "border-l-4 border-l-primary" : ""
      }`}
      onClick={() => {
        if (!notification.read && onMarkAsRead) {
          onMarkAsRead(notification.id);
        }
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 rounded-full p-2 ${typeColor}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm break-words">{notification.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 break-words">
                  {notification.message}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {notification.type === "info"
                      ? "資訊"
                      : notification.type === "success"
                      ? "成功"
                      : notification.type === "warning"
                      ? "警告"
                      : "錯誤"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(notification.createdAt)}
                  </span>
                </div>
              </div>
              {!notification.read && (
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary" />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (linkHref) {
    return (
      <Link href={linkHref} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
