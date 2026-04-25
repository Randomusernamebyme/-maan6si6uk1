"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getAuthToken } from "@/lib/utils/auth";
import { FileText, Users, ClipboardList, ArrowRight } from "lucide-react";

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
    recentApplicationsCount: 0,
    totalApplications: 0,
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
          recentApplicationsCount: data.recentApplicationsCount || 0,
          totalApplications: data.totalApplications || 0,
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
                    <div className="flex-1 min-w-0">
                      <Link 
                        href={`/admin/requests/${request.id}`}
                        className="font-medium hover:underline text-primary truncate block"
                        title={request.name}
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/requests?status=pending" className="block">
            <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50 cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/30 group-hover:bg-secondary/50 transition-colors">
                      <FileText className="h-5 w-5 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-1">查看待審核委托</CardTitle>
                      <CardDescription className="text-sm">
                        {stats.pendingRequests > 0 ? (
                          <span>
                            目前有 <span className="font-semibold text-foreground">{stats.pendingRequests}</span> 個委托待審核
                          </span>
                        ) : (
                          "目前沒有待審核的委托"
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
                {stats.pendingRequests > 0 && (
                  <div className="mt-3">
                    <Badge variant="secondary" className="text-xs">
                      {stats.pendingRequests} 個待處理
                    </Badge>
                  </div>
                )}
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/volunteers?status=pending" className="block">
            <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50 cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/30 group-hover:bg-secondary/50 transition-colors">
                      <Users className="h-5 w-5 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-1">查看待審核義工</CardTitle>
                      <CardDescription className="text-sm">
                        {stats.pendingVolunteers > 0 ? (
                          <span>
                            目前有 <span className="font-semibold text-foreground">{stats.pendingVolunteers}</span> 位義工待審核
                          </span>
                        ) : (
                          "目前沒有待審核的義工"
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
                {stats.pendingVolunteers > 0 && (
                  <div className="mt-3">
                    <Badge variant="secondary" className="text-xs">
                      {stats.pendingVolunteers} 位待處理
                    </Badge>
                  </div>
                )}
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/applications" className="block">
            <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50 cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/30 group-hover:bg-secondary/50 transition-colors">
                      <ClipboardList className="h-5 w-5 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-1">查看最新報名</CardTitle>
                      <CardDescription className="text-sm">
                        {stats.recentApplicationsCount > 0 ? (
                          <span>
                            最近24小時有 <span className="font-semibold text-foreground">{stats.recentApplicationsCount}</span> 個新報名
                          </span>
                        ) : (
                          "查看所有義工的報名記錄"
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
                {stats.recentApplicationsCount > 0 && (
                  <div className="mt-3">
                    <Badge variant="secondary" className="text-xs">
                      共 {stats.totalApplications} 個報名記錄
                    </Badge>
                  </div>
                )}
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/gallery" className="block">
            <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50 cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/30 group-hover:bg-secondary/50 transition-colors">
                      <FileText className="h-5 w-5 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-1">管理展覽</CardTitle>
                      <CardDescription className="text-sm">
                        建立花絮貼文，或將委托貼文公開展示
                      </CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

