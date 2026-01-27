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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createActivityLog } from "@/lib/utils/admin";
import { collection, query, where, onSnapshot, getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Application, ApplicationStatus } from "@/types";
import { convertTimestamp } from "@/lib/firebase/firestore";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  pending: "待審核",
  open: "已批准",
  published: "已發布",
  matched: "已配對",
  "in-progress": "進行中",
  completed: "已完成",
  cancelled: "已取消",
};

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);
  const [followUpMethod, setFollowUpMethod] = useState("");
  const [followUpContent, setFollowUpContent] = useState("");
  const [applications, setApplications] = useState<(Application & { volunteerName?: string })[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          throw new Error("請先登入");
        }

        const response = await fetch(`/api/admin/requests/${requestId}`, {
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

  // 加載報名數據
  useEffect(() => {
    if (!requestId) {
      setApplicationsLoading(false);
      return;
    }

    // 只有在請求已發布給義工時才加載報名數據
    if (request && (request.status === "published" || request.status === "matched" || request.status === "in-progress" || request.status === "completed")) {
      const q = query(
        collection(db, "applications"),
        where("requestId", "==", requestId)
      );

      const unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          try {
            const apps = await Promise.all(
              snapshot.docs.map(async (docSnapshot) => {
                const appData = docSnapshot.data();
                let volunteerName = "未知義工";
                
                try {
                  const volunteerDoc = await getDoc(doc(db, "users", appData.volunteerId));
                  if (volunteerDoc.exists()) {
                    volunteerName = volunteerDoc.data().displayName || volunteerName;
                  }
                } catch (err) {
                  console.error("Error fetching volunteer:", err);
                }

                return {
                  id: docSnapshot.id,
                  ...appData,
                  createdAt: convertTimestamp(appData.createdAt) || new Date(),
                  updatedAt: convertTimestamp(appData.updatedAt) || new Date(),
                  matchedAt: appData.matchedAt ? convertTimestamp(appData.matchedAt) : undefined,
                  completedAt: appData.completedAt ? convertTimestamp(appData.completedAt) : undefined,
                  volunteerName,
                } as Application & { volunteerName?: string };
              })
            );

            setApplications(apps);
            setApplicationsLoading(false);
          } catch (err) {
            console.error("Error processing applications:", err);
            setApplicationsLoading(false);
          }
        },
        (err) => {
          console.error("Error fetching applications:", err);
          setApplicationsLoading(false);
        }
      );

      return () => unsubscribe();
    } else {
      // 如果請求尚未發布，直接設置為空數組並停止載入
      setApplications([]);
      setApplicationsLoading(false);
    }
  }, [requestId, request]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error("請先登入");
      }

      const response = await fetch(`/api/admin/requests/${requestId}`, {
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

      // 創建操作日誌
      await createActivityLog(
        "update_request_status",
        "request",
        requestId,
        `將委托狀態從 ${request?.status} 更改為 ${newStatus}`,
        { oldStatus: request?.status, newStatus }
      );

      router.refresh();
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "更新失敗");
    }
  };

  const handleAddFollowUp = async () => {
    if (!followUpMethod.trim() || !followUpContent.trim()) {
      setError("請填寫聯絡方式和記錄內容");
      return;
    }

    try {
      setError(""); // 清除之前的錯誤
      const token = await getAuthToken();
      if (!token) {
        throw new Error("請先登入");
      }

      const followUps = request?.followUps || [];
      const newFollowUp = {
        date: new Date(),
        method: followUpMethod.trim(),
        content: followUpContent.trim(),
        adminId: "", // 將從 API 中獲取
      };

      const response = await fetch(`/api/admin/requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          followUps: [...followUps, newFollowUp],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "添加跟進記錄失敗");
      }

      // 重新獲取請求數據以更新 UI
      const updatedResponse = await fetch(`/api/admin/requests/${requestId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (updatedResponse.ok) {
        const data = await updatedResponse.json();
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
      }

      setShowFollowUpDialog(false);
      setFollowUpMethod("");
      setFollowUpContent("");
    } catch (err: any) {
      setError(err.message || "添加跟進記錄失敗");
    }
  };

  const formatDate = (date: Date | undefined | null) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return "無效日期";
    }
    return format(date, "yyyy年MM月dd日 HH:mm", { locale: zhTW });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  if (error && !request) {
    return <ErrorDisplay message={error} />;
  }

  if (!request) {
    return <ErrorDisplay message="委托不存在" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {request.name || "委托詳情"}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            編號：{request.id.substring(0, 8)}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          返回列表
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* 左側：委托資料 */}
        <div className="md:col-span-2 space-y-6">
          {/* 基本資料 */}
          <Card>
            <CardHeader>
              <CardTitle>基本資料</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>描述</Label>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                  {request.description}
                </p>
              </div>
              <div>
                <Label>領域</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {Array.isArray(request.fields) && request.fields.length > 0 ? (
                    request.fields.map((field) => (
                      <Badge key={field} variant="secondary">
                        {field}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">無</span>
                  )}
                </div>
              </div>
              {request.urgency && (
                <div>
                  <Label>緊急程度</Label>
                  <Badge
                    variant={request.urgency === "urgent" ? "destructive" : "default"}
                    className="mt-1"
                  >
                    {request.urgency === "urgent" ? "緊急" : "一般"}
                  </Badge>
                </div>
              )}
              {request.serviceType && (
                <div>
                  <Label>服務形式</Label>
                  <p className="text-sm text-muted-foreground mt-1">{request.serviceType}</p>
                </div>
              )}
              {request.estimatedDuration && (
                <div>
                  <Label>預計時長</Label>
                  <p className="text-sm text-muted-foreground mt-1">{request.estimatedDuration}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 委托者資料 */}
          <Card>
            <CardHeader>
              <CardTitle>委托者資料（敏感）</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>姓名</Label>
                <p className="text-sm text-muted-foreground mt-1">{request.requester.name}</p>
              </div>
              <div>
                <Label>電話</Label>
                <p className="text-sm text-muted-foreground mt-1">{request.requester.phone}</p>
              </div>
              <div>
                <Label>年齡</Label>
                <p className="text-sm text-muted-foreground mt-1">{request.requester.age}</p>
              </div>
              <div>
                <Label>居住地區</Label>
                <p className="text-sm text-muted-foreground mt-1">{request.requester.district}</p>
              </div>
            </CardContent>
          </Card>

          {/* 狀態時間線 */}
          <Card>
            <CardHeader>
              <CardTitle>狀態時間線</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                {/* 提交 */}
                <div className="flex items-start gap-3 pb-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-gray-500 border-2 border-white dark:border-gray-900"></div>
                    <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-1"></div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">提交（待審核）</div>
                    <div className="text-xs text-muted-foreground">{formatDate(request.createdAt)}</div>
                  </div>
                </div>

                {/* 已批准 */}
                {request.status !== "pending" && (
                  <div className="flex items-start gap-3 pb-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-gray-600 border-2 border-white dark:border-gray-900"></div>
                      {(request.status === "published" || request.status === "matched" || request.status === "in-progress" || request.status === "completed" || request.status === "cancelled") && (
                        <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-1"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">已批准</div>
                      <div className="text-xs text-muted-foreground">
                        {request.updatedAt 
                          ? formatDate(request.updatedAt) 
                          : "時間未記錄"}
                      </div>
                    </div>
                  </div>
                )}

                {/* 已發布 */}
                {(request.status === "published" || request.status === "matched" || request.status === "in-progress" || request.status === "completed") && (
                  <div className="flex items-start gap-3 pb-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-gray-700 border-2 border-white dark:border-gray-900"></div>
                      {(request.status === "matched" || request.status === "in-progress" || request.status === "completed") && (
                        <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-1"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">已發布</div>
                      <div className="text-xs text-muted-foreground">
                        {request.updatedAt 
                          ? formatDate(request.updatedAt) 
                          : "時間未記錄"}
                      </div>
                    </div>
                  </div>
                )}

                {/* 已配對 */}
                {request.matchedAt && (
                  <div className="flex items-start gap-3 pb-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-gray-800 border-2 border-white dark:border-gray-900"></div>
                      {(request.status === "in-progress" || request.status === "completed") && (
                        <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-1"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">已配對</div>
                      <div className="text-xs text-muted-foreground">{formatDate(request.matchedAt)}</div>
                    </div>
                  </div>
                )}

                {/* 進行中 */}
                {request.status === "in-progress" && (
                  <div className="flex items-start gap-3 pb-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-gray-900 border-2 border-white dark:border-gray-900"></div>
                      {!request.completedAt && (
                        <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-1"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">進行中</div>
                      <div className="text-xs text-muted-foreground">
                        {request.updatedAt ? formatDate(request.updatedAt) : "時間未記錄"}
                      </div>
                    </div>
                  </div>
                )}

                {/* 已完成 */}
                {request.completedAt && (
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-black border-2 border-white dark:border-gray-900"></div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">已完成</div>
                      <div className="text-xs text-muted-foreground">{formatDate(request.completedAt)}</div>
                    </div>
                  </div>
                )}

                {/* 已取消 */}
                {request.status === "cancelled" && (
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-gray-400 border-2 border-white dark:border-gray-900"></div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">已取消</div>
                      <div className="text-xs text-muted-foreground">
                        {request.updatedAt ? formatDate(request.updatedAt) : "時間未記錄"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 報名資料 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>報名資料</CardTitle>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/applications?request=${requestId}`}>
                    前往報名管理
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {applicationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loading size="sm" />
                </div>
              ) : request.status !== "published" && request.status !== "matched" && request.status !== "in-progress" && request.status !== "completed" ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  此委托尚未發布給義工，義工還無法申請
                </p>
              ) : applications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  目前沒有報名記錄
                </p>
              ) : (
                <div className="space-y-4">
                  {/* 已選中 */}
                  {applications.filter((app) => app.status === "approved").length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">
                        已選中 ({applications.filter((app) => app.status === "approved").length})
                      </h4>
                      <div className="space-y-2">
                        {applications
                          .filter((app) => app.status === "approved")
                          .map((app) => (
                            <div
                              key={app.id}
                              className="p-3 border rounded-md bg-gray-50 dark:bg-gray-900/20"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <Link 
                                      href={`/admin/volunteers/${app.volunteerId}`}
                                      className="font-semibold hover:underline text-primary"
                                    >
                                      {app.volunteerName}
                                    </Link>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    報名時間：{formatDate(app.createdAt)}
                                  </p>
                                  {app.availableTime && (
                                    <p className="text-xs text-muted-foreground">
                                      可服務時間：{app.availableTime}
                                    </p>
                                  )}
                                  {app.message && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {app.message}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* 待處理 */}
                  {applications.filter((app) => app.status === "pending").length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">
                        待處理 ({applications.filter((app) => app.status === "pending").length})
                      </h4>
                      <div className="space-y-2">
                        {applications
                          .filter((app) => app.status === "pending")
                          .map((app) => (
                            <div
                              key={app.id}
                              className="p-3 border rounded-md"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <Link 
                                      href={`/admin/volunteers/${app.volunteerId}`}
                                      className="font-semibold hover:underline text-primary"
                                    >
                                      {app.volunteerName}
                                    </Link>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    報名時間：{formatDate(app.createdAt)}
                                  </p>
                                  {app.availableTime && (
                                    <p className="text-xs text-muted-foreground">
                                      可服務時間：{app.availableTime}
                                    </p>
                                  )}
                                  {app.message && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {app.message}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        const token = await getAuthToken();
                                        if (!token) return;
                                        const response = await fetch(`/api/applications/${app.id}`, {
                                          method: "PATCH",
                                          headers: {
                                            "Content-Type": "application/json",
                                            Authorization: `Bearer ${token}`,
                                          },
                                          body: JSON.stringify({ status: "approved" }),
                                        });
                                        if (response.ok) {
                                          router.refresh();
                                        }
                                      } catch (err) {
                                        console.error("Error updating application:", err);
                                      }
                                    }}
                                  >
                                    選擇
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={async () => {
                                      try {
                                        const token = await getAuthToken();
                                        if (!token) return;
                                        const response = await fetch(`/api/applications/${app.id}`, {
                                          method: "PATCH",
                                          headers: {
                                            "Content-Type": "application/json",
                                            Authorization: `Bearer ${token}`,
                                          },
                                          body: JSON.stringify({ status: "rejected" }),
                                        });
                                        if (response.ok) {
                                          router.refresh();
                                        }
                                      } catch (err) {
                                        console.error("Error updating application:", err);
                                      }
                                    }}
                                  >
                                    拒絕
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* 未選中 */}
                  {applications.filter((app) => app.status === "rejected").length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">
                        未選中 ({applications.filter((app) => app.status === "rejected").length})
                      </h4>
                      <div className="space-y-2">
                        {applications
                          .filter((app) => app.status === "rejected")
                          .map((app) => (
                            <div
                              key={app.id}
                              className="p-3 border rounded-md bg-gray-50 dark:bg-gray-900/20"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <Link 
                                      href={`/admin/volunteers/${app.volunteerId}`}
                                      className="font-semibold hover:underline text-primary"
                                    >
                                      {app.volunteerName}
                                    </Link>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    報名時間：{formatDate(app.createdAt)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 跟進記錄 */}
          <Card>
            <CardHeader>
              <CardTitle>跟進記錄</CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(request.followUps) && request.followUps.length > 0 ? (
                <div className="space-y-4">
                  {request.followUps.map((followUp, index) => (
                    <div key={index} className="border-l-2 border-gray-300 dark:border-gray-700 pl-4 py-2">
                      <div className="text-sm text-muted-foreground">
                        {formatDate(followUp.date instanceof Date ? followUp.date : new Date(followUp.date))}
                      </div>
                      <div className="text-sm font-semibold mt-1">{followUp.method}</div>
                      <div className="text-sm mt-1">{followUp.content}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  目前沒有跟進記錄
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右側：操作面板 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>操作面板</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>當前狀態</Label>
                <Badge
                  variant={
                    request.status === "pending"
                      ? "outline"
                      : request.status === "completed"
                      ? "secondary"
                      : request.status === "cancelled"
                      ? "destructive"
                      : "default"
                  }
                  className="mt-2 block w-fit"
                >
                  {STATUS_LABELS[request.status] || request.status}
                </Badge>
              </div>

              {request.status === "pending" && (
                <div className="space-y-2">
                  <Button
                    onClick={() => handleStatusChange("open")}
                    className="w-full"
                  >
                    批准
                  </Button>
                  <Button
                    onClick={() => handleStatusChange("cancelled")}
                    variant="destructive"
                    className="w-full"
                  >
                    拒絕
                  </Button>
                </div>
              )}

              {request.status === "open" && (
                <div className="space-y-2">
                  <Button
                    onClick={() => handleStatusChange("published")}
                    className="w-full"
                  >
                    發布給義工
                  </Button>
                </div>
              )}

              {request.status === "published" && (
                <div className="space-y-2">
                  <Button
                    onClick={() => handleStatusChange("in-progress")}
                    className="w-full"
                  >
                    標記為進行中
                  </Button>
                </div>
              )}

              {request.status === "in-progress" && (
                <div className="space-y-2">
                  <Button
                    onClick={() => handleStatusChange("completed")}
                    className="w-full"
                  >
                    標記為已完成
                  </Button>
                  <Button
                    onClick={() => handleStatusChange("cancelled")}
                    variant="destructive"
                    className="w-full"
                  >
                    取消
                  </Button>
                </div>
              )}

              <div className="pt-4 border-t">
                <Button
                  onClick={() => setShowFollowUpDialog(true)}
                  variant="outline"
                  className="w-full"
                >
                  添加跟進記錄
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 添加跟進記錄對話框 */}
      <Dialog open={showFollowUpDialog} onOpenChange={setShowFollowUpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加跟進記錄</DialogTitle>
            <DialogDescription>記錄與委托者的聯絡情況</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="followUpMethod">聯絡方式</Label>
              <Input
                id="followUpMethod"
                value={followUpMethod}
                onChange={(e) => setFollowUpMethod(e.target.value)}
                placeholder="例如：電話、WhatsApp、上門"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="followUpContent">記錄內容</Label>
              <Textarea
                id="followUpContent"
                value={followUpContent}
                onChange={(e) => setFollowUpContent(e.target.value)}
                placeholder="請輸入跟進記錄..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFollowUpDialog(false)}>
              取消
            </Button>
            <Button onClick={handleAddFollowUp}>確認</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


