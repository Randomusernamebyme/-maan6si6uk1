"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
  update_request_status: "更新委托狀態",
  update_volunteer_status: "更新義工狀態",
  update_application_status: "更新報名狀態",
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  user: "義工",
  request: "委托",
  application: "報名",
  notification: "通知",
};

// 改進描述格式的函數
function formatDescription(log: ActivityLog & { adminName?: string }): string {
  // 如果已經有自定義描述，直接使用（通常是中文描述）
  if (log.description && log.description.trim()) {
    return log.description;
  }
  
  // 否則生成更易理解的描述
  const actionLabel = ACTION_LABELS[log.action] || log.action;
  const targetLabel = TARGET_TYPE_LABELS[log.targetType] || log.targetType;
  
  return `${actionLabel}了${targetLabel}`;
}

// 格式化變更詳情
function formatChanges(changes: any): string {
  if (!changes) return "";
  
  try {
    // 如果是狀態變更
    if (changes.oldStatus && changes.newStatus) {
      const statusLabels: Record<string, string> = {
        pending: "待審核",
        approved: "已批准",
        rejected: "已拒絕",
        suspended: "已暫停",
        open: "已批准",
        published: "已發布",
        matched: "已配對",
        "in-progress": "進行中",
        completed: "已完成",
        cancelled: "已取消",
      };
      
      const oldLabel = statusLabels[changes.oldStatus] || changes.oldStatus;
      const newLabel = statusLabels[changes.newStatus] || changes.newStatus;
      return `狀態：${oldLabel} → ${newLabel}`;
    }
    
    // 其他變更，格式化為易讀的文本
    const parts: string[] = [];
    for (const [key, value] of Object.entries(changes)) {
      if (key !== "oldStatus" && key !== "newStatus") {
        parts.push(`${key}: ${JSON.stringify(value)}`);
      }
    }
    return parts.join(", ");
  } catch {
    return JSON.stringify(changes);
  }
}

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

  const fetchLogs = useCallback(async () => {
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
      // 確保 logs 是陣列並轉換日期
      const logsArray = Array.isArray(data) ? data : (data.logs || []);
      const logsWithDates = logsArray.map((log: any) => ({
        ...log,
        createdAt: log.createdAt ? new Date(log.createdAt) : new Date(),
      }));
      setLogs(logsWithDates);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching logs:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, targetTypeFilter, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    let filtered = logs;

    // 搜尋篩選
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          formatDescription(log).toLowerCase().includes(query) ||
          log.adminName?.toLowerCase().includes(query) ||
          log.targetId.toLowerCase().includes(query) ||
          (ACTION_LABELS[log.action] || log.action).toLowerCase().includes(query) ||
          (TARGET_TYPE_LABELS[log.targetType] || log.targetType).toLowerCase().includes(query)
      );
    }

    return filtered;
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
    // fetchLogs 會自動觸發，因為依賴項改變了
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
            <Button variant="outline" onClick={handleReset}>
              重置篩選
            </Button>
            <p className="text-sm text-muted-foreground flex items-center">
              篩選條件會自動套用
            </p>
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
                <div className="col-span-2">操作時間</div>
                <div className="col-span-2">操作人</div>
                <div className="col-span-2">操作類型</div>
                <div className="col-span-1">目標</div>
                <div className="col-span-4">操作內容</div>
                <div className="col-span-1">詳情</div>
              </div>

              {/* 日誌列表 */}
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="grid grid-cols-12 gap-4 p-4 border rounded-md hover:bg-muted/30 transition-colors text-sm"
                >
                  <div className="col-span-2 flex items-center text-muted-foreground">
                    {log.createdAt && log.createdAt instanceof Date && !isNaN(log.createdAt.getTime())
                      ? format(log.createdAt, "yyyy年MM月dd日 HH:mm", { locale: zhTW })
                      : "無效日期"}
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="font-medium">{log.adminName || "未知操作人"}</span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <Badge variant="outline">{ACTION_LABELS[log.action] || log.action}</Badge>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <Badge variant="secondary">
                      {TARGET_TYPE_LABELS[log.targetType] || log.targetType}
                    </Badge>
                  </div>
                  <div className="col-span-4 flex items-center">
                    <div className="flex flex-col gap-1">
                      <span>{formatDescription(log)}</span>
                      {log.changes && (
                        <span className="text-xs text-muted-foreground">
                          {formatChanges(log.changes)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="col-span-1 flex items-center">
                    {log.changes && Object.keys(log.changes).length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const changesText = formatChanges(log.changes);
                          if (changesText) {
                            alert(`變更詳情：\n${changesText}`);
                          } else {
                            alert(`變更詳情：\n${JSON.stringify(log.changes, null, 2)}`);
                          }
                        }}
                        className="text-xs"
                      >
                        詳情
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
