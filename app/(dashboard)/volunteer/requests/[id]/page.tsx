"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/utils/auth";
import { Request } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  pending: "待審核",
  open: "已批准",
  published: "已發布",
  matched: "已配對",
  "in-progress": "進行中",
  completed: "已完成",
  cancelled: "已取消",
};

export default function VolunteerRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          throw new Error("請先登入");
        }

        const response = await fetch(`/api/volunteer/requests/${requestId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "獲取委托詳情失敗");
        }

        const data = await response.json();
        // 處理 followUps 中的日期
        let followUps = data.followUps;
        if (Array.isArray(followUps)) {
          followUps = followUps.map((followUp: any) => ({
            ...followUp,
            date: followUp.date ? new Date(followUp.date) : new Date(),
          }));
        }
        
        setRequest({
          ...data,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
          matchedAt: data.matchedAt ? new Date(data.matchedAt) : undefined,
          completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
          followUps: followUps,
        } as Request);
      } catch (err: any) {
        setError(err.message || "載入失敗");
      } finally {
        setLoading(false);
      }
    };

    if (requestId) {
      fetchRequest();
    }
  }, [requestId]);

  const formatDate = (date: Date) => {
    return format(date, "yyyy年MM月dd日 HH:mm", { locale: zhTW });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  if (!request) {
    return <ErrorDisplay message="委托不存在" />;
  }

  return (
    <div className="space-y-6">
      {/* 返回按鈕 */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回
      </Button>

      {/* 委托基本信息 */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">
                {request.name || request.fields?.join("、") || "未命名委托"}
              </CardTitle>
              <CardDescription>
                委托 ID: {request.id.substring(0, 8)}
              </CardDescription>
            </div>
            <Badge
              variant={
                request.status === "completed"
                  ? "secondary"
                  : request.status === "cancelled"
                  ? "destructive"
                  : request.status === "in-progress"
                  ? "default"
                  : "outline"
              }
            >
              {STATUS_LABELS[request.status] || request.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 幫助範疇 */}
          {request.fields && request.fields.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">幫助範疇</h3>
              <div className="flex flex-wrap gap-2">
                {request.fields.map((field) => (
                  <Badge key={field} variant="secondary">
                    {field}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 需求描述 */}
          {request.description && (
            <div>
              <h3 className="font-semibold mb-2">需求描述</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {request.description}
              </p>
            </div>
          )}

          {/* 委托者資訊 */}
          {request.requester && (
            <div>
              <h3 className="font-semibold mb-2">委托者資訊</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {request.requester.name && (
                  <div>
                    <span className="text-muted-foreground">姓名：</span>
                    <span>{request.requester.name}</span>
                  </div>
                )}
                {request.requester.phone && (
                  <div>
                    <span className="text-muted-foreground">電話：</span>
                    <span>{request.requester.phone}</span>
                  </div>
                )}
                {request.requester.age && (
                  <div>
                    <span className="text-muted-foreground">年齡：</span>
                    <span>{request.requester.age}</span>
                  </div>
                )}
                {request.requester.district && (
                  <div>
                    <span className="text-muted-foreground">地區：</span>
                    <span>{request.requester.district}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 回報方式 */}
          {request.appreciation && (
            <div>
              <h3 className="font-semibold mb-2">回報方式</h3>
              <p className="text-sm text-muted-foreground">{request.appreciation}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
