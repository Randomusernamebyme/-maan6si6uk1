"use client";

import { useState, useEffect, useMemo } from "react";
import { ActivityLog } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error";
import { Label } from "@/components/ui/label";
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

const ACTION_LABELS: Record<string, string> = {
  approve: "批准",
  reject: "拒絕",
  suspend: "暫停",
  restore: "恢復",
  update: "更新",
  create: "創建",
  delete: "刪除",
  merge: "合併",
  publish: "發布",
  complete: "完成",
  cancel: "取消",
  match: "配對",
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  user: "義工",
  request: "委托",
  application: "報名",
  notification: "通知",
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<(ActivityLog & { adminName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 篩選狀態
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      if (!token) {
        throw new Error("請先登入");
      }

      // 構建查詢參數
      const params = new URLSearchParams();
      if (actionFilter !== "all") params.append("action", actionFilter);
      if (targetTypeFilter !== "all") params.append("targetType", targetTypeFilter);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/admin/logs?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "獲取日誌失敗");
      }

      const data = await response.json();
      setLogs(data);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching logs:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    if (!searchQuery) return logs;

    const query = searchQuery.toLowerCase();
    return logs.filter(
      (log) =>
        log.description.toLowerCase().includes(query) ||
        log.adminName?.toLowerCase().includes(query) ||
        log.targetId.toLowerCase().includes(query)
    );
  }, [logs, searchQuery]);

  // 獲取所有唯一的操作類型
  const uniqueActions = useMemo(() => {
    const actions = new Set(logs.map((log) => log.action));
    return Array.from(actions).sort();
  }, [logs]);

  const handleReset = () => {
    setActionFilter("all");
    setTargetTypeFilter("all");
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
    fetchLogs();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay message={`載入操作日誌時發生錯誤: ${error.message}`} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">操作日誌</h2>
        <p className="text-muted-foreground">查看所有管理員操作記錄（不可編輯或刪除）</p>
      </div>

      {/* 篩選區域 */}
      <Card>
        <CardHeader>
          <CardTitle>篩選條件</CardTitle>
          <CardDescription>根據操作類型、目標類型和日期範圍篩選日誌</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 操作類型 */}
            <div className="space-y-2">
              <Label>操作類型</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇操作類型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有操作</SelectItem>
                  {uniqueActions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {ACTION_LABELS[action] || action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 目標類型 */}
            <div className="space-y-2">
              <Label>目標類型</Label>
              <Select value={targetTypeFilter} onValueChange={setTargetTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇目標類型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有類型</SelectItem>
                  {Object.entries(TARGET_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 開始日期 */}
            <div className="space-y-2">
              <Label>開始日期</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* 結束日期 */}
            <div className="space-y-2">
              <Label>結束日期</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* 搜尋 */}
          <div className="space-y-2">
            <Label>搜尋</Label>
            <Input
              placeholder="搜尋操作描述、操作人或目標ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={fetchLogs}>套用篩選</Button>
            <Button variant="outline" onClick={handleReset}>
              重置
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 日誌列表 */}
      <Card>
        <CardHeader>
          <CardTitle>日誌記錄</CardTitle>
          <CardDescription>共 {filteredLogs.length} 條記錄</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">沒有符合條件的日誌記錄</div>
          ) : (
            <div className="space-y-2">
              {/* 表格標題 */}
              <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 rounded-md font-semibold text-sm">
                <div className="col-span-2">時間</div>
                <div className="col-span-1">操作人</div>
                <div className="col-span-1">操作類型</div>
                <div className="col-span-1">目標類型</div>
                <div className="col-span-4">操作描述</div>
                <div className="col-span-2">目標ID</div>
                <div className="col-span-1">詳情</div>
              </div>

              {/* 日誌列表 */}
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="grid grid-cols-12 gap-4 p-4 border rounded-md hover:bg-muted/30 transition-colors text-sm"
                >
                  <div className="col-span-2 flex items-center text-muted-foreground">
                    {format(log.createdAt, "yyyy-MM-dd HH:mm:ss", { locale: zhTW })}
                  </div>
                  <div className="col-span-1 flex items-center">
                    <span className="font-medium">{log.adminName || "未知"}</span>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <Badge variant="outline">{ACTION_LABELS[log.action] || log.action}</Badge>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <Badge variant="secondary">
                      {TARGET_TYPE_LABELS[log.targetType] || log.targetType}
                    </Badge>
                  </div>
                  <div className="col-span-4 flex items-center">
                    <span>{log.description}</span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {log.targetId.substring(0, 12)}...
                    </code>
                  </div>
                  <div className="col-span-1 flex items-center">
                    {log.changes && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          alert(JSON.stringify(log.changes, null, 2));
                        }}
                      >
                        查看
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
