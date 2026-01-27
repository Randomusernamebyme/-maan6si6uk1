"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error";
import Link from "next/link";
import { getAuthToken } from "@/lib/utils/auth";

interface PendingRequest {
  id: string;
  name: string;
  status: string;
  createdAt?: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    pendingRequests: 0,
    pendingVolunteers: 0,
    inProgressRequests: 0,
    totalVolunteers: 0,
  });
  const [pendingRequestsList, setPendingRequestsList] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          throw new Error("請先登入");
        }

        const response = await fetch("/api/admin/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "獲取統計數據失敗");
        }

        const data = await response.json();
        setStats({
          pendingRequests: data.pendingRequests || 0,
          pendingVolunteers: data.pendingVolunteers || 0,
          inProgressRequests: data.inProgressRequests || 0,
          totalVolunteers: data.totalVolunteers || 0,
        });
        setPendingRequestsList(data.pendingRequestsList || []);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching stats:", err);
        setError(err.message || "載入統計數據時發生錯誤");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">統計概覽</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>待審核委托</CardDescription>
              <CardTitle className="text-3xl">{stats.pendingRequests}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>待審核義工</CardDescription>
              <CardTitle className="text-3xl">{stats.pendingVolunteers}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>進行中委托</CardDescription>
              <CardTitle className="text-3xl">{stats.inProgressRequests}</CardTitle>
              <CardDescription className="text-xs mt-1">
                已配對或進行中
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>總義工人數</CardDescription>
              <CardTitle className="text-3xl">{stats.totalVolunteers}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* 待審核委托列表 */}
      {pendingRequestsList.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">待審核委托</h2>
            <Button asChild variant="outline">
              <Link href="/admin/requests?status=pending">查看全部</Link>
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                {pendingRequestsList.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex-1">
                      <Link 
                        href={`/admin/requests/${request.id}`}
                        className="font-medium hover:underline text-primary"
                      >
                        {request.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        編號：{request.id.substring(0, 8)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold mb-4">快捷操作</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <Link href="/admin/requests?status=pending">
              <CardHeader>
                <CardTitle>查看待審核委托</CardTitle>
                <CardDescription>
                  目前有 {stats.pendingRequests} 個委托待審核
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <Link href="/admin/volunteers?status=pending">
              <CardHeader>
                <CardTitle>查看待審核義工</CardTitle>
                <CardDescription>
                  目前有 {stats.pendingVolunteers} 位義工待審核
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <Link href="/admin/applications">
              <CardHeader>
                <CardTitle>查看最新報名</CardTitle>
                <CardDescription>查看所有義工的報名記錄</CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}

