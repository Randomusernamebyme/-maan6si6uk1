"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Request } from "@/types";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

interface RequestCardProps {
  request: Request;
  onApply?: (requestId: string) => void;
  showRequesterInfo?: boolean;
}

export function RequestCard({ request, onApply, showRequesterInfo = false }: RequestCardProps) {
  const formatDate = (date: Date) => {
    return format(date, "yyyy年MM月dd日", { locale: zhTW });
  };

  return (
    <Card className="border-2 hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">
              {request.fields.join("、")}
            </CardTitle>
            <CardDescription>
              創建時間：{formatDate(request.createdAt)}
            </CardDescription>
          </div>
          <Badge
            variant={
              request.status === "open"
                ? "default"
                : request.status === "matched"
                ? "secondary"
                : "outline"
            }
          >
            {request.status === "open"
              ? "開放報名"
              : request.status === "matched"
              ? "已配對"
              : request.status === "completed"
              ? "已完成"
              : request.status === "cancelled"
              ? "已取消"
              : "待審核"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">需求描述</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {request.description}
          </p>
        </div>

        {showRequesterInfo && request.requester && (
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">委托者資訊</h4>
            <div className="text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">姓名：</span>
                {request.requester.name}
              </p>
              <p>
                <span className="text-muted-foreground">電話：</span>
                {request.requester.phone}
              </p>
              <p>
                <span className="text-muted-foreground">年齡：</span>
                {request.requester.age}
              </p>
              <p>
                <span className="text-muted-foreground">地區：</span>
                {request.requester.district}
              </p>
            </div>
          </div>
        )}

        {request.appreciation && (
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">回報方式</h4>
            <p className="text-sm text-muted-foreground">{request.appreciation}</p>
          </div>
        )}

        {onApply && request.status === "open" && (
          <div className="border-t pt-4">
            <button
              onClick={() => onApply(request.id)}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              報名此委托
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

