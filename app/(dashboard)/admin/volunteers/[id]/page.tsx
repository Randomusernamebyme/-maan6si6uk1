"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, query, where, getDocs, doc as firestoreDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { User, Application, ActivityLog, Request } from "@/types";
import { convertTimestamp } from "@/lib/firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { getAuthToken } from "@/lib/utils/auth";
import Link from "next/link";

// 安全的日期格式化函數
const formatDate = (date: Date | undefined | null, formatStr: string = "yyyy年MM月dd日 HH:mm") => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return "無效日期";
  }
  return format(date, formatStr, { locale: zhTW });
};

const STATUS_LABELS = {
  pending: "待審核",
  approved: "已批准",
  rejected: "已拒絕",
  suspended: "已暫停",
};

const APPLICATION_STATUS_LABELS = {
  pending: "待處理",
  approved: "已選中",
  rejected: "未選中",
  completed: "已完成",
};

export default function AdminVolunteerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const volunteerId = params.id as string;

  const [volunteer, setVolunteer] = useState<User | null>(null);
  const [applications, setApplications] = useState<(Application & { requestTitle?: string })[]>([]);
  const [logs, setLogs] = useState<(ActivityLog & { userName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 對話框狀態
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [interviewNotes, setInterviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 獲取義工資料
        const volunteerDoc = await getDoc(firestoreDoc(db, "users", volunteerId));
        if (!volunteerDoc.exists()) {
          throw new Error("義工不存在");
        }

        const volunteerData = {
          uid: volunteerDoc.id,
          ...volunteerDoc.data(),
          createdAt: convertTimestamp(volunteerDoc.data().createdAt),
          updatedAt: convertTimestamp(volunteerDoc.data().updatedAt),
          interviewDate: volunteerDoc.data().interviewDate
            ? convertTimestamp(volunteerDoc.data().interviewDate)
            : undefined,
          lastLoginAt: volunteerDoc.data().lastLoginAt
            ? convertTimestamp(volunteerDoc.data().lastLoginAt)
            : undefined,
        } as User;

        setVolunteer(volunteerData);

        // 獲取報名記錄
        const applicationsQuery = query(
          collection(db, "applications"),
          where("volunteerId", "==", volunteerId)
        );
        const applicationsSnapshot = await getDocs(applicationsQuery);

        const applicationsData = await Promise.all(
          applicationsSnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const application = {
              id: doc.id,
              ...data,
              createdAt: convertTimestamp(data.createdAt),
              updatedAt: convertTimestamp(data.updatedAt),
              matchedAt: data.matchedAt ? convertTimestamp(data.matchedAt) : undefined,
              completedAt: data.completedAt ? convertTimestamp(data.completedAt) : undefined,
            } as Application;

            // 獲取委托標題（使用 API 路由以避免權限問題）
            try {
              const token = await getAuthToken();
              if (token) {
                const response = await fetch(`/api/admin/requests/${application.requestId}`, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });
                if (response.ok) {
                  const requestData = await response.json();
                  return {
                    ...application,
                    requestTitle: requestData.fields?.join("、") || "未知",
                  };
                }
              }
              // 如果 API 失敗，嘗試直接讀取（管理員應該有權限）
              const requestDoc = await getDoc(firestoreDoc(db, "requests", application.requestId));
              return {
                ...application,
                requestTitle: requestDoc.exists()
                  ? requestDoc.data()?.fields?.join("、") || "未知"
                  : "未知",
              };
            } catch (error) {
              console.error("Error fetching request:", error);
              return {
                ...application,
                requestTitle: "未知",
              };
            }
          })
        );

        setApplications(applicationsData);

        // 獲取操作日誌
        const logsQuery = query(
          collection(db, "activity_logs"),
          where("targetType", "==", "user"),
          where("targetId", "==", volunteerId)
        );
        const logsSnapshot = await getDocs(logsQuery);

        const logsData = await Promise.all(
          logsSnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const log = {
              id: doc.id,
              ...data,
              createdAt: convertTimestamp(data.createdAt),
            } as ActivityLog;

            // 獲取操作者姓名
            try {
              const userDoc = await getDoc(firestoreDoc(db, "users", log.userId));
              return {
                ...log,
                userName: userDoc.exists() ? userDoc.data()?.displayName || "未知" : "未知",
              };
            } catch (error) {
              console.error("Error fetching user:", error);
              return {
                ...log,
                userName: "未知",
              };
            }
          })
        );

        setLogs(logsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));

        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching volunteer data:", err);
        setError(err);
        setLoading(false);
      }
    };

    fetchData();
  }, [volunteerId]);

  const handleStatusChange = async (newStatus: string, notes?: string) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error("請先登入");
      }

      const updateData: any = { status: newStatus };
      if (notes) {
        if (newStatus === "approved") {
          updateData.interviewNotes = notes;
          updateData.interviewDate = new Date();
        } else if (newStatus === "rejected") {
          updateData.rejectionReason = notes;
        }
      }

      const response = await fetch(`/api/admin/volunteers/${volunteerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "更新失敗");
      }

      alert("更新成功！");
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      alert("更新失敗：" + (err.message || "請稍後再試"));
    }
  };

  const handleApprove = () => {
    setApproveDialogOpen(false);
    handleStatusChange("approved", interviewNotes);
  };

  const handleReject = () => {
    setRejectDialogOpen(false);
    handleStatusChange("rejected", rejectionReason);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  if (error || !volunteer) {
    return <ErrorDisplay message={error?.message || "義工不存在"} />;
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{volunteer.displayName}</h2>
          <p className="text-muted-foreground">{volunteer.email}</p>
        </div>
        <Badge
          variant={
            volunteer.status === "pending"
              ? "outline"
              : volunteer.status === "approved"
              ? "default"
              : volunteer.status === "rejected"
              ? "destructive"
              : "secondary"
          }
        >
          {STATUS_LABELS[volunteer.status]}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側：義工資料 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本資料 */}
          <Card>
            <CardHeader>
              <CardTitle>基本資料</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">姓名</Label>
                  <p className="font-medium">{volunteer.displayName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{volunteer.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">電話 (WhatsApp)</Label>
                  <p className="font-medium">{volunteer.phone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">年齡</Label>
                  <p className="font-medium">{volunteer.age}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 服務資料 */}
          <Card>
            <CardHeader>
              <CardTitle>服務資料</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">服務範疇</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Array.isArray(volunteer.fields) && volunteer.fields.length > 0 ? (
                    volunteer.fields.map((field) => (
                      <Badge key={field} variant="secondary">
                        {field}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm">無</span>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">技能列表</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Array.isArray(volunteer.skills) && volunteer.skills.length > 0 ? (
                    volunteer.skills.map((skill, index) => (
                      <Badge key={index} variant="outline">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm">無</span>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">可服務時間</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Array.isArray(volunteer.availability) && volunteer.availability.length > 0 ? (
                    volunteer.availability.map((day, index) => (
                      <Badge key={index} variant="outline">
                        {day}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm">無</span>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">想服務的對象</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Array.isArray(volunteer.targetAudience) && volunteer.targetAudience.length > 0 ? (
                    volunteer.targetAudience.map((audience, index) => (
                      <Badge key={index} variant="outline">
                        {audience}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm">無</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 動機與經驗 */}
          <Card>
            <CardHeader>
              <CardTitle>動機與經驗</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{volunteer.goals || "無"}</p>
            </CardContent>
          </Card>

          {/* 統計 */}
          <Card>
            <CardHeader>
              <CardTitle>統計數據</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">完成委托數</Label>
                <p className="text-2xl font-bold">{volunteer.completedTasks || 0}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">報名次數</Label>
                <p className="text-2xl font-bold">{applications.length}</p>
              </div>
            </CardContent>
          </Card>

          {/* 面試記錄 */}
          {volunteer.interviewNotes && (
            <Card>
              <CardHeader>
                <CardTitle>面試記錄</CardTitle>
                <CardDescription>
                  {volunteer.interviewDate &&
                    formatDate(volunteer.interviewDate, "yyyy年MM月dd日")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{volunteer.interviewNotes}</p>
              </CardContent>
            </Card>
          )}

          {/* 拒絕原因 */}
          {volunteer.status === "rejected" && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">拒絕原因</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">
                  {(volunteer as any).rejectionReason || "無"}
                </p>
              </CardContent>
            </Card>
          )}

          {/* 參與歷史和操作日誌 */}
          <Tabs defaultValue="applications" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="applications">參與歷史</TabsTrigger>
              <TabsTrigger value="logs">操作日誌</TabsTrigger>
            </TabsList>

            <TabsContent value="applications" className="space-y-4">
              {applications.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    目前沒有報名記錄
                  </CardContent>
                </Card>
              ) : (
                applications.map((application) => (
                  <Card key={application.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          <Link
                            href={`/admin/requests/${application.requestId}`}
                            className="hover:underline"
                          >
                            {application.requestTitle}
                          </Link>
                        </CardTitle>
                        <Badge
                          variant={
                            application.status === "approved"
                              ? "default"
                              : application.status === "rejected"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {APPLICATION_STATUS_LABELS[application.status]}
                        </Badge>
                      </div>
                      <CardDescription>
                        報名時間：
                        {formatDate(application.createdAt)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {application.message && (
                        <div>
                          <Label className="text-muted-foreground">留言：</Label>
                          <p>{application.message}</p>
                        </div>
                      )}
                      {application.availableTime && (
                        <div>
                          <Label className="text-muted-foreground">可服務時間：</Label>
                          <p>{application.availableTime}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="logs" className="space-y-4">
              {logs.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    目前沒有操作日誌
                  </CardContent>
                </Card>
              ) : (
                logs.map((log) => (
                  <Card key={log.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{log.description}</CardTitle>
                        <Badge variant="outline">{log.action}</Badge>
                      </div>
                      <CardDescription>
                        操作人：{log.userName} •{" "}
                        {formatDate(log.createdAt)}
                      </CardDescription>
                    </CardHeader>
                    {log.changes && Object.keys(log.changes).length > 0 && (
                      <CardContent className="text-sm">
                        <Label className="text-muted-foreground">變更內容：</Label>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs">
                          {JSON.stringify(log.changes, null, 2)}
                        </pre>
                      </CardContent>
                    )}
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* 右側：操作面板 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>操作面板</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* pending 狀態：批准/拒絕 */}
              {volunteer.status === "pending" && (
                <>
                  <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full">批准</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>批准義工申請</DialogTitle>
                        <DialogDescription>
                          請輸入面試記錄（選填）
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="interviewNotes">面試記錄</Label>
                          <Textarea
                            id="interviewNotes"
                            placeholder="記錄面試內容..."
                            value={interviewNotes}
                            onChange={(e) => setInterviewNotes(e.target.value)}
                            rows={4}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
                          取消
                        </Button>
                        <Button onClick={handleApprove}>確認批准</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        拒絕
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>拒絕義工申請</DialogTitle>
                        <DialogDescription>
                          請輸入拒絕原因（必填）
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="rejectionReason">拒絕原因</Label>
                          <Textarea
                            id="rejectionReason"
                            placeholder="請輸入拒絕原因..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={4}
                            required
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                          取消
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleReject}
                          disabled={!rejectionReason.trim()}
                        >
                          確認拒絕
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}

              {/* approved 狀態：暫停/編輯 */}
              {volunteer.status === "approved" && (
                <>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      if (confirm("確定要暫停此義工嗎？")) {
                        handleStatusChange("suspended");
                      }
                    }}
                  >
                    暫停
                  </Button>
                </>
              )}

              {/* suspended 狀態：恢復 */}
              {volunteer.status === "suspended" && (
                <Button
                  className="w-full"
                  onClick={() => {
                    if (confirm("確定要恢復此義工嗎？")) {
                      handleStatusChange("approved");
                    }
                  }}
                >
                  恢復
                </Button>
              )}

              {/* 返回列表 */}
              <Button variant="outline" className="w-full" asChild>
                <Link href="/admin/volunteers">返回列表</Link>
              </Button>
            </CardContent>
          </Card>

          {/* 系統資訊 */}
          <Card>
            <CardHeader>
              <CardTitle>系統資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <Label className="text-muted-foreground">用戶ID</Label>
                <p className="font-mono text-xs break-all">{volunteer.uid}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">註冊時間</Label>
                <p>
                  {formatDate(volunteer.createdAt)}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">最後更新</Label>
                <p>
                  {formatDate(volunteer.updatedAt)}
                </p>
              </div>
              {volunteer.lastLoginAt && (
                <div>
                  <Label className="text-muted-foreground">最後登入</Label>
                  <p>
                    {formatDate(volunteer.lastLoginAt)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
