"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Application, ApplicationStatus } from "@/types";
import { convertTimestamp } from "@/lib/firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { getAuthToken } from "@/lib/utils/auth";
import { useRouter } from "next/navigation";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: "待處理",
  approved: "已選中",
  rejected: "未選中",
  completed: "已完成",
};

export default function AdminApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<(Application & { requestTitle?: string; volunteerName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [requestFilter, setRequestFilter] = useState<string>("all");
  const [volunteerFilter, setVolunteerFilter] = useState<string>("all");

  useEffect(() => {
    const q = query(
      collection(db, "applications"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const docData = doc.data();
          return {
            id: doc.id,
            ...docData,
            createdAt: convertTimestamp(docData.createdAt),
            updatedAt: convertTimestamp(docData.updatedAt),
            matchedAt: docData.matchedAt ? convertTimestamp(docData.matchedAt) : undefined,
            completedAt: docData.completedAt ? convertTimestamp(docData.completedAt) : undefined,
            requestTitle: `委托 ${doc.id.substring(0, 8)}`,
            volunteerName: `義工 ${docData.volunteerId?.substring(0, 8) || "未知"}`,
          } as Application & { requestTitle?: string; volunteerName?: string };
        });
        setApplications(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching applications:", err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      if (statusFilter !== "all" && application.status !== statusFilter) return false;
      if (requestFilter !== "all" && application.requestId !== requestFilter) return false;
      if (volunteerFilter !== "all" && application.volunteerId !== volunteerFilter) return false;
      return true;
    });
  }, [applications, statusFilter, requestFilter, volunteerFilter]);

  const handleStatusChange = async (applicationId: string, newStatus: ApplicationStatus) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error("請先登入");
      }

      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "更新失敗");
      }

      router.refresh();
    } catch (err: any) {
      alert("更新失敗：" + (err.message || "請稍後再試"));
    }
  };

  const formatDate = (date: Date) => {
    return format(date, "yyyy年MM月dd日 HH:mm", { locale: zhTW });
  };

  // 按委托分組
  const groupedByRequest = useMemo(() => {
    const groups: Record<string, typeof filteredApplications> = {};
    filteredApplications.forEach((app) => {
      if (!groups[app.requestId]) {
        groups[app.requestId] = [];
      }
      groups[app.requestId].push(app);
    });
    return groups;
  }, [filteredApplications]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay message="載入報名記錄時發生錯誤" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">報名管理</h2>
      </div>

      {/* 篩選 */}
      <Card>
        <CardHeader>
          <CardTitle>篩選</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="選擇狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部狀態</SelectItem>
                <SelectItem value="pending">待處理</SelectItem>
                <SelectItem value="approved">已選中</SelectItem>
                <SelectItem value="rejected">未選中</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 按委托分組顯示 */}
      <div className="space-y-6">
        {Object.entries(groupedByRequest).map(([requestId, apps]) => (
          <Card key={requestId}>
            <CardHeader>
              <CardTitle>{apps[0]?.requestTitle || "未知委托"}</CardTitle>
              <CardDescription>委托 ID: {requestId.substring(0, 8)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apps.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 border rounded-md"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-semibold">{app.volunteerName}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(app.createdAt)}
                          </p>
                        </div>
                        <Badge
                          variant={
                            app.status === "pending"
                              ? "outline"
                              : app.status === "approved"
                              ? "default"
                              : app.status === "rejected"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {STATUS_LABELS[app.status]}
                        </Badge>
                      </div>
                      {app.message && (
                        <p className="text-sm text-muted-foreground mt-2">{app.message}</p>
                      )}
                      {app.availableTime && (
                        <p className="text-sm text-muted-foreground mt-1">
                          可服務時間：{app.availableTime}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {app.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(app.id, "approved")}
                          >
                            選擇
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusChange(app.id, "rejected")}
                          >
                            拒絕
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

