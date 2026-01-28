"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error";
import { getAuthToken } from "@/lib/utils/auth";

type ExportType = "requests" | "volunteers" | "applications";

export default function AdminExportPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportType, setExportType] = useState<ExportType>("requests");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [previewCount, setPreviewCount] = useState<number>(0);

  const handleExportCSV = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getAuthToken();
      if (!token) {
        throw new Error("請先登入");
      }

      // 使用 API 端點獲取數據（使用 Admin SDK）
      const params = new URLSearchParams({
        type: exportType,
        status: statusFilter,
      });
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/admin/export?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "獲取數據失敗");
      }

      const { data, count } = await response.json();
      setPreviewCount(count);

      let headers: string[] = [];
      let rows: string[][] = [];

      // 根據類型生成 CSV 格式
      if (exportType === "requests") {
        headers = [
          "編號",
          "委托名稱",
          "狀態",
          "描述",
          "領域",
          "委托者姓名",
          "委托者電話",
          "委托者年齡",
          "委托者地區",
          "緊急程度",
          "服務形式",
          "預計時長",
          "配對時間",
          "完成時間",
          "提交時間",
          "最後更新",
        ];

        rows = data.map((item: any) => [
          item.id.substring(0, 8),
          item.name || (Array.isArray(item.fields) ? item.fields.join("、") : "未命名"),
          item.status || "",
          (item.description || "").replace(/[\n\r]/g, " "),
          Array.isArray(item.fields) ? item.fields.join("、") : "",
          item.requester?.name || "",
          item.requester?.phone || "",
          item.requester?.age || "",
          item.requester?.district || "",
          item.urgency || "",
          item.serviceType || "",
          item.estimatedDuration || "",
          item.matchedAt ? item.matchedAt.toLocaleString("zh-TW") : "",
          item.completedAt ? item.completedAt.toLocaleString("zh-TW") : "",
          item.createdAt ? item.createdAt.toLocaleString("zh-TW") : "",
          item.updatedAt ? item.updatedAt.toLocaleString("zh-TW") : "",
        ]);
      } else if (exportType === "volunteers") {
        headers = [
          "用戶ID",
          "姓名",
          "Email",
          "電話",
          "年齡",
          "狀態",
          "服務範疇",
          "技能",
          "可服務時間",
          "想服務的對象",
          "完成委托數",
          "註冊時間",
          "最後更新",
        ];

        rows = data.map((item: any) => [
          item.uid.substring(0, 12),
          item.displayName || "",
          item.email || "",
          item.phone || "",
          item.age || "",
          item.status || "",
          Array.isArray(item.fields) ? item.fields.join("、") : "",
          Array.isArray(item.skills) ? item.skills.join("、") : "",
          Array.isArray(item.availability) ? item.availability.join("、") : "",
          Array.isArray(item.targetAudience) ? item.targetAudience.join("、") : "",
          item.completedTasks?.toString() || "0",
          item.createdAt ? item.createdAt.toLocaleString("zh-TW") : "",
          item.updatedAt ? item.updatedAt.toLocaleString("zh-TW") : "",
        ]);
      } else if (exportType === "applications") {
        headers = [
          "報名ID",
          "委托名稱",
          "委托領域",
          "義工姓名",
          "義工Email",
          "狀態",
          "留言",
          "可服務時間",
          "配對時間",
          "完成時間",
          "報名時間",
          "最後更新",
        ];

        rows = data.map((item: any) => [
          item.id.substring(0, 8),
          item.requestName || "未知委托",
          Array.isArray(item.requestFields) ? item.requestFields.join("、") : "",
          item.volunteerName || "未知義工",
          item.volunteerEmail || "",
          item.status || "",
          (item.message || "").replace(/[\n\r]/g, " "),
          item.availableTime || "",
          item.matchedAt ? item.matchedAt.toLocaleString("zh-TW") : "",
          item.completedAt ? item.completedAt.toLocaleString("zh-TW") : "",
          item.createdAt ? item.createdAt.toLocaleString("zh-TW") : "",
          item.updatedAt ? item.updatedAt.toLocaleString("zh-TW") : "",
        ]);
      }

      // 生成 CSV
      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      // 添加 BOM 以支援中文
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const dateStr = new Date().toISOString().split("T")[0];
      const typeLabels: Record<ExportType, string> = {
        requests: "委托",
        volunteers: "義工",
        applications: "報名",
      };
      link.download = `${typeLabels[exportType]}_${dateStr}.csv`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // 顯示成功訊息
      alert(`成功匯出 ${rows.length} 條記錄！`);
    } catch (err: any) {
      console.error("Export error:", err);
      setError(err.message || "匯出失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    // Excel 匯出功能（使用 CSV 格式，Excel 可以打開）
    await handleExportCSV();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">數據匯出</h2>
        <p className="text-muted-foreground">匯出委托列表、義工列表或報名記錄為 CSV 格式（可用 Excel 打開）</p>
      </div>

      {error && <ErrorDisplay message={error} />}

      <Card>
        <CardHeader>
          <CardTitle>依條件匯出</CardTitle>
          <CardDescription>
            先選擇要匯出的資料種類，再設定狀態與日期範圍，系統會按照這些條件產生匯出檔案
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 數據類型與狀態 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>資料類型</Label>
              <Select value={exportType} onValueChange={(v) => setExportType(v as ExportType)}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇資料類型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="requests">委托列表</SelectItem>
                  <SelectItem value="volunteers">義工列表</SelectItem>
                  <SelectItem value="applications">報名記錄</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>狀態條件</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有狀態</SelectItem>
                  {exportType === "requests" && (
                    <>
                      <SelectItem value="pending">待審核</SelectItem>
                      <SelectItem value="open">已批准</SelectItem>
                      <SelectItem value="published">已發布</SelectItem>
                      <SelectItem value="matched">已配對</SelectItem>
                      <SelectItem value="in-progress">進行中</SelectItem>
                      <SelectItem value="completed">已完成</SelectItem>
                      <SelectItem value="cancelled">已取消</SelectItem>
                    </>
                  )}
                  {exportType === "volunteers" && (
                    <>
                      <SelectItem value="pending">待審核</SelectItem>
                      <SelectItem value="approved">已批准</SelectItem>
                      <SelectItem value="rejected">已拒絕</SelectItem>
                      <SelectItem value="suspended">已暫停</SelectItem>
                    </>
                  )}
                  {exportType === "applications" && (
                    <>
                      <SelectItem value="pending">待處理</SelectItem>
                      <SelectItem value="approved">已選中</SelectItem>
                      <SelectItem value="rejected">未選中</SelectItem>
                      <SelectItem value="completed">已完成</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 日期範圍 */}
          <div className="space-y-2">
            <Label>日期範圍（依建立時間）</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">從這一天（含當日）之後建立的資料</p>
              </div>
              <div className="space-y-1">
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">到這一天（含當日）之前建立的資料</p>
              </div>
            </div>
          </div>

          {/* 預覽統計 */}
          {previewCount > 0 && (
            <div className="rounded-md bg-muted p-4 text-sm">
              <p className="font-semibold">
                目前條件：{exportType === "requests" ? "委托" : exportType === "volunteers" ? "義工" : "報名"}，
                狀態「
                {statusFilter === "all"
                  ? "所有狀態"
                  : statusFilter === "pending"
                  ? exportType === "applications"
                    ? "待處理"
                    : "待審核"
                  : statusFilter === "approved"
                  ? exportType === "applications"
                    ? "已選中"
                    : "已批准"
                  : statusFilter === "rejected"
                  ? exportType === "applications"
                    ? "未選中"
                    : "已拒絕"
                  : statusFilter === "suspended"
                  ? "已暫停"
                  : statusFilter === "open"
                  ? "已批准"
                  : statusFilter === "published"
                  ? "已發布"
                  : statusFilter === "matched"
                  ? "已配對"
                  : statusFilter === "in-progress"
                  ? "進行中"
                  : statusFilter === "completed"
                  ? "已完成"
                  : statusFilter === "cancelled"
                  ? "已取消"
                  : statusFilter}
                」；將匯出 {previewCount} 條記錄
              </p>
            </div>
          )}

          {/* 匯出按鈕 */}
          <div className="flex gap-4">
            <Button onClick={handleExportCSV} disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loading size="sm" className="mr-2" />
                  匯出中...
                </>
              ) : (
                "匯出為 CSV"
              )}
            </Button>
            <Button onClick={handleExportExcel} variant="outline" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loading size="sm" className="mr-2" />
                  匯出中...
                </>
              ) : (
                "匯出為 Excel"
              )}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p className="font-semibold mb-2">注意事項：</p>
            <ul className="list-disc list-inside space-y-1">
              <li>CSV 文件可使用 Excel、Google Sheets 或其他表格軟件打開</li>
              <li>匯出的數據包含敏感信息（如委托者電話），請妥善保管</li>
              <li>日期範圍為選填，不填寫則匯出所有符合條件的記錄</li>
              <li>報名記錄匯出包含委托名稱和義工姓名，方便查看</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

