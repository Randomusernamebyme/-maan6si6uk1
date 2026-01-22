"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, query, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Application, ApplicationStatus, Request, User } from "@/types";
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
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: "待處理",
  approved: "已選中",
  rejected: "未選中",
  completed: "已完成",
};

type ApplicationWithDetails = Application & { 
  requestTitle?: string; 
  volunteerName?: string;
  request?: Request;
  volunteer?: User;
};

export default function AdminApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [requests, setRequests] = useState<Record<string, Request>>({});
  const [volunteers, setVolunteers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const searchParams = useSearchParams();
  const initialRequestId = searchParams?.get("requestId");
  const initialApplicationId = searchParams?.get("applicationId");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [requestFilter, setRequestFilter] = useState<string>("all");
  const [volunteerFilter, setVolunteerFilter] = useState<string>("all");
  const [highlightApplicationId, setHighlightApplicationId] = useState<string | null>(
    initialApplicationId || null
  );

  // 獲取委托和義工資料
  useEffect(() => {
    const unsubscribeApplications = onSnapshot(
      query(collection(db, "applications")),
      async (snapshot) => {
        try {
          const appsData = snapshot.docs.map((doc) => {
            const docData = doc.data();
            return {
              id: doc.id,
              ...docData,
              createdAt: convertTimestamp(docData.createdAt) || new Date(),
              updatedAt: convertTimestamp(docData.updatedAt) || new Date(),
              matchedAt: docData.matchedAt ? convertTimestamp(docData.matchedAt) : undefined,
              completedAt: docData.completedAt ? convertTimestamp(docData.completedAt) : undefined,
              status: docData.status || "pending",
              requestId: docData.requestId || "",
              volunteerId: docData.volunteerId || "",
            } as Application;
          });

          // 獲取所有關聯的委托和義工
          const requestIds = [...new Set(appsData.map(app => app.requestId).filter(Boolean))];
          const volunteerIds = [...new Set(appsData.map(app => app.volunteerId).filter(Boolean))];

          // 並行獲取委托和義工資料
          const [requestsData, volunteersData] = await Promise.all([
            Promise.all(requestIds.map(async (id) => {
              try {
                const docSnap = await getDoc(doc(db, "requests", id));
                if (docSnap.exists()) {
                  const data = docSnap.data();
                  return {
                    id: docSnap.id,
                    ...data,
                    createdAt: convertTimestamp(data.createdAt) || new Date(),
                    updatedAt: convertTimestamp(data.updatedAt) || new Date(),
                  } as Request;
                }
                return null;
              } catch (err) {
                console.error(`Error fetching request ${id}:`, err);
                return null;
              }
            })),
            Promise.all(volunteerIds.map(async (id) => {
              try {
                const docSnap = await getDoc(doc(db, "users", id));
                if (docSnap.exists()) {
                  const data = docSnap.data();
                  return { 
                    uid: docSnap.id,
                    ...data,
                    createdAt: convertTimestamp(data.createdAt) || new Date(),
                    updatedAt: convertTimestamp(data.updatedAt) || new Date(),
                    lastLoginAt: data.lastLoginAt ? convertTimestamp(data.lastLoginAt) : undefined,
                    interviewDate: data.interviewDate ? convertTimestamp(data.interviewDate) : undefined,
                  } as unknown as User;
                }
                return null;
              } catch (err) {
                console.error(`Error fetching volunteer ${id}:`, err);
                return null;
              }
            }))
          ]);

          // 建立查找表
          const requestsMap: Record<string, Request> = {};
          requestsData.forEach(req => {
            if (req) requestsMap[req.id] = req;
          });

          const volunteersMap: Record<string, User> = {};
          volunteersData.forEach(vol => {
            if (vol) volunteersMap[vol.uid] = vol;
          });

          setRequests(requestsMap);
          setVolunteers(volunteersMap);

          // 組合完整資料
          const enrichedApps: ApplicationWithDetails[] = appsData.map(app => ({
            ...app,
            request: requestsMap[app.requestId],
            volunteer: volunteersMap[app.volunteerId],
            requestTitle: requestsMap[app.requestId]?.title || 
                         (requestsMap[app.requestId]?.fields?.join("、") || `委托 ${app.requestId.substring(0, 8)}`),
            volunteerName: volunteersMap[app.volunteerId]?.displayName || `義工 ${app.volunteerId.substring(0, 8)}`,
          }));

          // 排序
          enrichedApps.sort((a, b) => {
            if (!a.createdAt || !b.createdAt) return 0;
            return b.createdAt.getTime() - a.createdAt.getTime();
          });

          setApplications(enrichedApps);
          setLoading(false);
          setError(null);

          // 設置初始篩選
          if (initialRequestId && requestFilter === "all") {
            setRequestFilter(initialRequestId);
          }
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

    return () => unsubscribeApplications();
  }, [initialRequestId]);

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
        {Object.entries(groupedByRequest).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              目前沒有報名記錄
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedByRequest).map(([requestId, apps]) => (
            <Card key={requestId}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{apps[0]?.requestTitle || "未知委托"}</CardTitle>
                    <CardDescription className="mt-1">
                      委托 ID: {requestId.substring(0, 8)}
                      <Button asChild variant="link" className="p-0 h-auto ml-2">
                        <Link href={`/admin/requests/${requestId}`}>查看委托詳情</Link>
                      </Button>
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{apps.length} 個報名</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {apps.map((app) => (
                    <div
                      key={app.id}
                      className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-md ${
                        highlightApplicationId === app.id ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20" : ""
                      }`}
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{app.volunteerName}</p>
                            <Button asChild variant="link" className="p-0 h-auto text-xs">
                              <Link href={`/admin/volunteers/${app.volunteerId}`}>查看資料</Link>
                            </Button>
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
                          <p className="text-sm text-muted-foreground">
                            {formatDate(app.createdAt)}
                          </p>
                        </div>
                        {app.availableTime && (
                          <p className="text-sm">
                            <span className="text-muted-foreground">可服務時間：</span>
                            {app.availableTime}
                          </p>
                        )}
                        {app.message && (
                          <p className="text-sm">
                            <span className="text-muted-foreground">留言：</span>
                            {app.message}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {app.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(app.id, "approved")}
                            >
                              選中
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
          ))
        )}
      </div>
    </div>
  );
}

