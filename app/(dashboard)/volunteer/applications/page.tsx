"use client";

import { useApplications } from "@/lib/hooks/useApplications";
import { useRequest } from "@/lib/hooks/useRequest";
import { useAuth } from "@/lib/hooks/useAuth";
import { RequestCard } from "@/components/requests/RequestCard";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

export default function ApplicationsPage() {
  const { user } = useAuth();
  const { applications, loading, error } = useApplications(user?.uid);

  const formatDate = (date: Date) => {
    return format(date, "yyyy年MM月dd日 HH:mm", { locale: zhTW });
  };

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
        <div className="space-y-4">
          {applications.map((application) => (
            <ApplicationItem
              key={application.id}
              application={application}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicationItem({
  application,
  formatDate,
}: {
  application: any;
  formatDate: (date: Date) => string;
}) {
  const { request, loading } = useRequest(application.requestId);

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
    pending: "待審核",
    approved: "已通過",
    rejected: "已拒絕",
    completed: "已完成",
  };

  const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    pending: "outline",
    approved: "default",
    rejected: "destructive",
    completed: "secondary",
  };

  return (
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
      </CardContent>
    </Card>
  );
}

