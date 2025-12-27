"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useRequests } from "@/lib/hooks/useRequests";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { Request } from "@/types";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RequestDetailDialog } from "@/components/requests/RequestDetailDialog";

export default function VolunteerDashboardPage() {
  const { user } = useAuth();
  const { requests, loading, error } = useRequests("published");
  const [searchQuery, setSearchQuery] = useState("");
  const [fieldFilter, setFieldFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"latest" | "urgent">("latest");
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  // 篩選和排序委托
  const filteredRequests = useMemo(() => {
    let filtered = requests.filter((request) => {
      // 只顯示符合義工 fields 的委托
      if (user?.fields && user.fields.length > 0) {
        const hasMatchingField = request.fields.some((field) =>
          user.fields!.includes(field)
        );
        if (!hasMatchingField) return false;
      }

      // 搜尋功能
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          request.description.toLowerCase().includes(query) ||
          request.fields.some((f) => f.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // 領域篩選
      if (fieldFilter !== "all") {
        if (!request.fields.includes(fieldFilter as any)) return false;
      }

      // 緊急程度篩選
      if (urgencyFilter !== "all") {
        const isUrgent = request.urgency === "urgent";
        if (urgencyFilter === "urgent" && !isUrgent) return false;
        if (urgencyFilter === "normal" && isUrgent) return false;
      }

      return true;
    });

    // 排序
    filtered.sort((a, b) => {
      if (sortBy === "latest") {
        return b.createdAt.getTime() - a.createdAt.getTime();
      } else {
        // 最緊急優先
        if (a.urgency === "urgent" && b.urgency !== "urgent") return -1;
        if (a.urgency !== "urgent" && b.urgency === "urgent") return 1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

    return filtered;
  }, [requests, user?.fields, searchQuery, fieldFilter, urgencyFilter, sortBy]);

  // 統計數據
  const stats = useMemo(() => {
    // 這裡需要從 applications 獲取數據，暫時使用占位符
    return {
      applicationsCount: 0,
      completedCount: 0,
      unreadNotifications: 0,
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay message="載入委托列表時發生錯誤" />;
  }

  return (
    <div className="space-y-6">
      {/* 歡迎訊息和統計 */}
      <div>
        <h1 className="text-3xl font-bold mb-2">
          Hi {user?.displayName || "義工"}！
        </h1>
        <div className="grid gap-4 md:grid-cols-3 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>已報名委托</CardDescription>
              <CardTitle className="text-2xl">{stats.applicationsCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>已完成委托</CardDescription>
              <CardTitle className="text-2xl">{stats.completedCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>未讀通知</CardDescription>
              <CardTitle className="text-2xl">{stats.unreadNotifications}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* 篩選和搜尋 */}
      <Card>
        <CardHeader>
          <CardTitle>委托列表</CardTitle>
          <CardDescription>選擇適合的委托進行報名</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="搜尋委托標題或描述..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Select value={fieldFilter} onValueChange={setFieldFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="選擇領域" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有領域</SelectItem>
                  <SelectItem value="生活助手">生活助手</SelectItem>
                  <SelectItem value="社區拍檔">社區拍檔</SelectItem>
                  <SelectItem value="街坊樹窿">街坊樹窿</SelectItem>
                </SelectContent>
              </Select>
              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="緊急程度" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="urgent">緊急</SelectItem>
                  <SelectItem value="normal">一般</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as "latest" | "urgent")}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="排序方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">最新</SelectItem>
                  <SelectItem value="urgent">最緊急</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 委托列表 */}
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">目前沒有符合條件的委托</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    userSkills={user?.skills || []}
                    onClick={() => setSelectedRequest(request)}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 委托詳情彈窗 */}
      {selectedRequest && (
        <RequestDetailDialog
          request={selectedRequest}
          userSkills={user?.skills || []}
          open={!!selectedRequest}
          onOpenChange={(open) => !open && setSelectedRequest(null)}
        />
      )}
    </div>
  );
}

function RequestCard({
  request,
  userSkills,
  onClick,
}: {
  request: Request;
  userSkills: string[];
  onClick: () => void;
}) {
  const formatDate = (date: Date) => {
    return format(date, "yyyy年MM月dd日", { locale: zhTW });
  };

  const hasMatchingSkills = request.requiredSkills
    ? request.requiredSkills.some((skill) => userSkills.includes(skill))
    : false;

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2">{request.fields.join("、")}</CardTitle>
          {request.urgency === "urgent" && (
            <Badge variant="destructive">緊急</Badge>
          )}
        </div>
        <CardDescription>發布時間：{formatDate(request.createdAt)}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
          {request.description}
        </p>
        <div className="flex flex-wrap gap-2">
          {request.fields.map((field) => (
            <Badge key={field} variant="secondary">
              {field}
            </Badge>
          ))}
        </div>
        {hasMatchingSkills && (
          <Badge variant="outline" className="mt-2">
            匹配您的技能
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

