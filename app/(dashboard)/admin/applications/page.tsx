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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loading } from "@/components/ui/loading";
import { Checkbox } from "@/components/ui/checkbox";

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
};

export default function AdminApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const initialRequestId = searchParams?.get("requestId") || searchParams?.get("request");
  const initialApplicationId = searchParams?.get("applicationId") || searchParams?.get("application");
  const [requestFilter, setRequestFilter] = useState<string>(initialRequestId || "all");
  const [volunteerFilter, setVolunteerFilter] = useState<string>("all");
  const [highlightApplicationId, setHighlightApplicationId] = useState<string | null>(
    initialApplicationId || null
  );
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  const [showBatchEditDialog, setShowBatchEditDialog] = useState(false);
  const [batchStatus, setBatchStatus] = useState<string>("");
  const [batchProcessing, setBatchProcessing] = useState(false);

  useEffect(() => {
    if (initialRequestId) {
      setRequestFilter(initialRequestId);
    }
  }, [initialRequestId]);

  useEffect(() => {
    const q = query(
      collection(db, "applications")
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const applicationsData = await Promise.all(
            snapshot.docs.map(async (docSnapshot) => {
              const docData = docSnapshot.data();
              const application: ApplicationWithDetails = {
                id: docSnapshot.id,
                ...docData,
                createdAt: convertTimestamp(docData.createdAt) || new Date(),
                updatedAt: convertTimestamp(docData.updatedAt) || new Date(),
                matchedAt: docData.matchedAt ? convertTimestamp(docData.matchedAt) : undefined,
                completedAt: docData.completedAt ? convertTimestamp(docData.completedAt) : undefined,
                status: docData.status || "pending",
                requestId: docData.requestId || "",
                volunteerId: docData.volunteerId || "",
                message: docData.message || null,
                availableTime: docData.availableTime || null,
              } as Application;

              // 載入委托資料
              if (application.requestId) {
                try {
                  const requestDoc = await getDoc(doc(db, "requests", application.requestId));
                  if (requestDoc.exists()) {
                    const requestData = requestDoc.data();
                    application.request = {
                      id: requestDoc.id,
                      ...requestData,
                      createdAt: convertTimestamp(requestData.createdAt),
                      updatedAt: convertTimestamp(requestData.updatedAt),
                      matchedAt: requestData.matchedAt ? convertTimestamp(requestData.matchedAt) : undefined,
                      completedAt: requestData.completedAt ? convertTimestamp(requestData.completedAt) : undefined,
                    } as Request;
                    application.requestTitle = requestData.name || (Array.isArray(requestData.fields) && requestData.fields.length > 0 ? requestData.fields.join("、") : "未知委托");
                  } else {
                    application.requestTitle = "委托不存在";
                  }
                } catch (err) {
                  console.error(`Error loading request ${application.requestId}:`, err);
                  application.requestTitle = "載入失敗";
                }
              }

              // 載入義工資料
              if (application.volunteerId) {
                try {
                  const volunteerDoc = await getDoc(doc(db, "users", application.volunteerId));
                  if (volunteerDoc.exists()) {
                    const volunteerData = volunteerDoc.data();
                    application.volunteerName = volunteerData.displayName || volunteerData.email || `義工 ${application.volunteerId.substring(0, 8)}`;
                  } else {
                    application.volunteerName = "義工不存在";
                  }
                } catch (err) {
                  console.error(`Error loading volunteer ${application.volunteerId}:`, err);
                  application.volunteerName = "載入失敗";
                }
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

    return () => unsubscribe();
  }, []);

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      if (statusFilter !== "all" && application.status !== statusFilter) return false;
      if (requestFilter !== "all" && (application.requestId || "") !== requestFilter) return false;
      if (volunteerFilter !== "all" && (application.volunteerId || "") !== volunteerFilter) return false;
      return true;
    });
  }, [applications, statusFilter, requestFilter, volunteerFilter]);

  const toggleSelectApplication = (applicationId: string) => {
    const newSelected = new Set(selectedApplications);
    if (newSelected.has(applicationId)) {
      newSelected.delete(applicationId);
    } else {
      newSelected.add(applicationId);
    }
    setSelectedApplications(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedApplications.size === filteredApplications.length) {
      setSelectedApplications(new Set());
    } else {
      setSelectedApplications(new Set(filteredApplications.map((a) => a.id)));
    }
  };

  const handleBatchEdit = async () => {
    if (selectedApplications.size === 0) return;
    if (!batchStatus) {
      alert("請選擇要更改的狀態");
      return;
    }

    try {
      setBatchProcessing(true);
      const token = await getAuthToken();
      if (!token) {
        throw new Error("請先登入");
      }

      const newStatus = batchStatus as ApplicationStatus;
      if (!["pending", "approved", "rejected", "completed"].includes(newStatus)) {
        throw new Error("無效的狀態");
      }

      const updatePromises = Array.from(selectedApplications).map(async (applicationId) => {
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
      });

      await Promise.all(updatePromises);

      setSelectedApplications(new Set());
      setShowBatchEditDialog(false);
      setBatchStatus("");
      router.refresh();
      alert(`成功更新 ${selectedApplications.size} 個報名的狀態！`);
    } catch (err: any) {
      alert("批量操作失敗：" + (err.message || "請稍後再試"));
    } finally {
      setBatchProcessing(false);
    }
  };

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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">報名管理</h2>
        {selectedApplications.size > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBatchEditDialog(true)}
          >
            批量編輯 ({selectedApplications.size})
          </Button>
        )}
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{apps[0]?.requestTitle || "未知委托"}</CardTitle>
                  <CardDescription>
                    委托 ID: {requestId.substring(0, 8)}
                    <Button asChild variant="link" className="p-0 h-auto ml-2">
                      <Link href={`/admin/requests/${requestId}`}>查看委托詳情</Link>
                    </Button>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={apps.every((app) => selectedApplications.has(app.id)) && apps.length > 0}
                    onCheckedChange={() => {
                      const allSelected = apps.every((app) => selectedApplications.has(app.id));
                      const newSelected = new Set(selectedApplications);
                      if (allSelected) {
                        apps.forEach((app) => newSelected.delete(app.id));
                      } else {
                        apps.forEach((app) => newSelected.add(app.id));
                      }
                      setSelectedApplications(newSelected);
                    }}
                  />
                  <span className="text-sm text-muted-foreground">全選此委托</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apps.map((app) => (
                  <div
                    key={app.id}
                    className={`flex items-center gap-4 p-4 border rounded-md ${
                      highlightApplicationId === app.id ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20" : ""
                    }`}
                  >
                    <Checkbox
                      checked={selectedApplications.has(app.id)}
                      onCheckedChange={() => toggleSelectApplication(app.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-semibold">{app.volunteerName || "未知義工"}</p>
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
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/volunteers/${app.volunteerId}`}>查看義工資料</Link>
                      </Button>
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

      {/* 批量編輯對話框 */}
      <Dialog open={showBatchEditDialog} onOpenChange={setShowBatchEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>批量編輯報名</DialogTitle>
            <DialogDescription>
              已選擇 {selectedApplications.size} 個報名，請選擇要更改的狀態
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>選擇新狀態 *</Label>
              <Select value={batchStatus} onValueChange={setBatchStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="請選擇狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">待處理</SelectItem>
                  <SelectItem value="approved">已選中</SelectItem>
                  <SelectItem value="rejected">未選中</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                將把選中的 {selectedApplications.size} 個報名的狀態更改為所選狀態
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBatchEditDialog(false);
                setBatchStatus("");
              }}
              disabled={batchProcessing}
            >
              取消
            </Button>
            <Button
              onClick={handleBatchEdit}
              disabled={batchProcessing || !batchStatus}
            >
              {batchProcessing ? (
                <>
                  <Loading size="sm" className="mr-2" />
                  處理中...
                </>
              ) : (
                "確認執行"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

