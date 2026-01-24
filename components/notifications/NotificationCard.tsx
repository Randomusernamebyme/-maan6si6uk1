"use client";

import { Notification } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import Link from "next/link";

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
}

const TYPE_COLORS: Record<Notification["type"], string> = {
  info: "bg-blue-500",
  success: "bg-green-500",
  warning: "bg-yellow-500",
  error: "bg-red-500",
};

const TYPE_LABELS: Record<Notification["type"], string> = {
  info: "資訊",
  success: "成功",
  warning: "警告",
  error: "錯誤",
};

export function NotificationCard({ notification, onMarkAsRead }: NotificationCardProps) {
  const handleClick = () => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const getLink = () => {
    if (notification.relatedRequestId) {
      return `/admin/requests/${notification.relatedRequestId}`;
    }
    if (notification.relatedApplicationId) {
      return `/admin/applications`;
    }
    return null;
  };

  const link = getLink();
  const CardWrapper = link ? Link : "div";
  const wrapperProps = link ? { href: link } : {};

  return (
    <CardWrapper {...wrapperProps}>
      <Card
        className={`cursor-pointer transition-all hover:shadow-md ${
          !notification.read ? "border-2 border-foreground bg-muted/50" : ""
        }`}
        onClick={handleClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg">{notification.title}</CardTitle>
                <Badge
                  variant="outline"
                  className={`${TYPE_COLORS[notification.type]} text-white border-0`}
                >
                  {TYPE_LABELS[notification.type]}
                </Badge>
                {!notification.read && (
                  <Badge variant="default" className="bg-blue-500">
                    未讀
                  </Badge>
                )}
              </div>
              <CardDescription className="text-sm mt-1">
                {format(notification.createdAt, "yyyy年MM月dd日 HH:mm", {
                  locale: zhTW,
                })}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {notification.message}
          </p>
        </CardContent>
      </Card>
    </CardWrapper>
  );
}
