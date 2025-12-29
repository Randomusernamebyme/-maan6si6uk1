"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, query, onSnapshot, getDoc, doc } from "firebase/firestore";
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
    let unsubscribe: (() => void) | null = null;

    const fetchApplications = async () => {
      try {
        setLoading(true);
        const token = await getAuthToken();
        if (!token) {
          throw new Error("請先登入");
        }

        // 獲取所有申請
        const q = query(collection(db, "applications"));
        unsubscribe = onSnapshot(
          q,
          async (snapshot) => {
            try {
              const applicationsData = await Promise.all(
                snapshot.docs.map(async (docItem) => {
                  const docData = docItem.data();
                  const application = {
                    id: docItem.id,
                    ...docData,
                    createdAt: convertTimestamp(docData.createdAt) || new Date(),
                    updatedAt: convertTimestamp(docData.updatedAt) || new Date(),
                    matchedAt: docData.matchedAt ? convertTimestamp(docData.matchedAt) : undefined,
                    completedAt: docData.completedAt ? convertTimestamp(docData.completedAt) : undefined,
                    status: docData.status || "pending",
                    requestId: docData.requestId || "",
                    volunteerId: docData.volunteerId || "",
                  } as Application & { requestTitle?: string; volunteerName?: string; requestStatus?: string };

                  // 獲取 request 信息
                  try {
                    const requestResponse = await fetch(`/api/admin/requests/${application.requestId}`, {
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    });
                    if (requestResponse.ok) {
                      const requestData = await requestResponse.json();
                      application.requestTitle = requestData.fields?.join("、") || "未知委托";
                      application.requestStatus = requestData.status || "未知";
                    }
                  } catch (error) {
                    console.error("Error fetching request:", error);
                    application.requestTitle = "未知委托";
                  }

                  // 獲取 volunteer 信息
                  try {
                    const volunteerDoc = await getDoc(doc(db, "users", application.volunteerId));
                    if (volunteerDoc.exists()) {
                      application.volunteerName = volunteerDoc.data()?.displayName || "未知義工";
                    } else {
                      application.volunteerName = "未知義工";
                    }
                  } catch (error) {
                    console.error("Error fetching volunteer:", error);
                    application.volunteerName = "未知義工";
                  }

                  return application;
                })
              );

              // 手動排序
              applicationsData.sort((a, b) => {
                if (!a.createdAt || !b.createdAt) return 0;
                return b.createdAt.getTime() - a.createdAt.getTime();
              });

              setApplications(applicationsData);
              setLoading(false);
              setError(null);
            } catch (err) {
              console.error("Error processing applications data:", err);
              setError(err as Error);
              setLoading(false);
            }
          },
          (err) => {
            console.error("Error fetching applications:", err);
            setError(err as Error);
            setLoading(false);
          }
        );
      } catch (err: any) {
        console.error("Error setting up applications listener:", err);
        setError(err as Error);
        setLoading(false);
      }
    };

    fetchApplications();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      if (statusFilter !== "all" && application.status !== statusFilter) return false;
      if (requestFilter !== "all" && (application.requestId || "") !== requestFilter) return false;
      if (volunteerFilter !== "all" && (application.volunteerId || "") !== volunteerFilter) return false;
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

  const formatDate = (date: Date | undefined | null) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return "無效日期";
    }
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
                      {app.requestStatus && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm text-muted-foreground">委托狀態：</span>
                          <Badge
                            variant={
                              app.requestStatus === "matched"
                                ? "default"
                                : app.requestStatus === "in-progress"
                                ? "default"
                                : app.requestStatus === "completed"
                                ? "secondary"
                                : app.requestStatus === "cancelled"
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {app.requestStatus === "matched"
                              ? "已配對"
                              : app.requestStatus === "in-progress"
                              ? "進行中"
                              : app.requestStatus === "completed"
                              ? "已完成"
                              : app.requestStatus === "cancelled"
                              ? "已取消"
                              : app.requestStatus}
                          </Badge>
                        </div>
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

