"use client";

import { useApplications } from "@/lib/hooks/useApplications";
import { useRequest } from "@/lib/hooks/useRequest";
import { useAuth } from "@/lib/hooks/useAuth";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { useState } from "react";
import { getAuthToken } from "@/lib/utils/auth";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ApplicationsPage() {
  const { user } = useAuth();
  const { applications, loading, error } = useApplications(user?.uid);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const formatDate = (date: Date) => {
    return format(date, "yyyy年MM月dd日 HH:mm", { locale: zhTW });
  };

  // 按狀態分類
  const pendingApps = applications.filter((app) => app.status === "pending");
  const approvedApps = applications.filter((app) => app.status === "approved");
  const rejectedApps = applications.filter((app) => app.status === "rejected");
  const completedApps = applications.filter((app) => app.status === "completed");

  // 根據篩選器獲取應用列表
  const filteredApplications =
    statusFilter === "all"
      ? applications
      : statusFilter === "pending"
      ? pendingApps
      : statusFilter === "approved"
      ? approvedApps
      : statusFilter === "rejected"
      ? rejectedApps
      : completedApps;

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
        <h2 className="text-2xl font-bold mb-2">我的報名</h2>
        <p className="text-muted-foreground">
          以下是您已報名的委托記錄和狀態。
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">您還沒有報名任何委托</p>
        </div>
      ) : (
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">全部 ({applications.length})</TabsTrigger>
            <TabsTrigger value="pending">待處理 ({pendingApps.length})</TabsTrigger>
            <TabsTrigger value="approved">已選中 ({approvedApps.length})</TabsTrigger>
            <TabsTrigger value="rejected">未選中 ({rejectedApps.length})</TabsTrigger>
            <TabsTrigger value="completed">已完成 ({completedApps.length})</TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter} className="mt-6">
            {filteredApplications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {statusFilter === "all"
                    ? "您還沒有報名任何委托"
                    : `目前沒有${getStatusLabel(statusFilter)}的報名記錄`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((application) => (
                  <ApplicationItem
                    key={application.id}
                    application={application}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "待處理",
    approved: "已選中",
    rejected: "未選中",
    completed: "已完成",
  };
  return labels[status] || status;
}

function ApplicationItem({
  application,
  formatDate,
}: {
  application: any;
  formatDate: (date: Date) => string;
}) {
  const { request, loading } = useRequest(application.requestId);
  const router = useRouter();
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const handleWithdraw = async () => {
    try {
      setWithdrawing(true);
      const token = await getAuthToken();
      if (!token) {
        throw new Error("請先登入");
      }

      const response = await fetch(`/api/applications/${application.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "撤回失敗");
      }

      setShowWithdrawDialog(false);
      router.refresh();
    } catch (err: any) {
      alert("撤回失敗：" + (err.message || "請稍後再試"));
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <Loading size="sm" />
        </CardContent>
      </Card>
    );
  }

  if (!request) {
    return null;
  }

  const statusLabels: Record<string, string> = {
    pending: "待處理",
    approved: "已選中",
    rejected: "未選中",
    completed: "已完成",
  };

  const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    pending: "outline",
    approved: "default",
    rejected: "destructive",
    completed: "secondary",
  };

  return (
    <>
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{request.fields.join("、")}</CardTitle>
            <Badge variant={statusVariants[application.status] || "outline"}>
              {statusLabels[application.status] || application.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              {request.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">報名時間：</span>
              <span>{formatDate(application.createdAt)}</span>
            </div>
            {application.availableTime && (
              <div>
                <span className="text-muted-foreground">可服務時間：</span>
                <span>{application.availableTime}</span>
              </div>
            )}
            {application.matchedAt && (
              <div>
                <span className="text-muted-foreground">配對時間：</span>
                <span>{formatDate(application.matchedAt)}</span>
              </div>
            )}
            {application.completedAt && (
              <div>
                <span className="text-muted-foreground">完成時間：</span>
                <span>{formatDate(application.completedAt)}</span>
              </div>
            )}
          </div>

          {application.message && (
            <div className="border-t pt-4">
              <p className="text-sm">
                <span className="text-muted-foreground">您的留言：</span>
                {application.message}
              </p>
            </div>
          )}

          {application.status === "approved" && (
            <div className="border-t pt-4">
              <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-4 text-sm text-blue-800 dark:text-blue-200">
                請留意 WhatsApp，團隊會聯絡你
              </div>
            </div>
          )}

          {application.status === "pending" && (
            <div className="border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setShowWithdrawDialog(true)}
                className="w-full"
              >
                撤回報名
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認撤回報名</DialogTitle>
            <DialogDescription>
              您確定要撤回此報名嗎？此操作無法復原。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowWithdrawDialog(false)}
              disabled={withdrawing}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleWithdraw}
              disabled={withdrawing}
            >
              {withdrawing ? <Loading size="sm" /> : "確認撤回"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
