"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

interface RecentRequest {
  id: string;
  name: string;
  district?: string;
  completedAt: string | null;
}

export function RecentCompletedRequestsSection() {
  const [requests, setRequests] = useState<RecentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/stats");
        if (!response.ok) {
          throw new Error("獲取統計數據失敗");
        }
        const data = await response.json();
        const latest: any[] = data.latestCompletedRequests || [];
        setRequests(
          latest.map((item) => ({
            id: item.id,
            name: item.name,
            district: item.district,
            completedAt: item.completedAt,
          }))
        );
      } catch (error) {
        console.error("Error fetching latest completed requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading || requests.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">最新完成的委托</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b last:border-b-0 pb-3 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{request.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 break-words">
                      編號：<span className="font-mono">{request.id.substring(0, 8)}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {request.district && (
                      <Badge variant="outline" className="text-xs">
                        {request.district}
                      </Badge>
                    )}
                    {request.completedAt && (
                      <span className="text-xs text-muted-foreground">
                        完成於{" "}
                        {format(new Date(request.completedAt), "yyyy年MM月dd日", { locale: zhTW })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

