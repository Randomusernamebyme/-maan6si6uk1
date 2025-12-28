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
import { getAuthToken } from "@/lib/utils/auth";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { convertTimestamp } from "@/lib/firebase/firestore";

type ExportType = "requests" | "volunteers" | "applications";

export default function AdminExportPage() {
  const [loading, setLoading] = useState(false);
  const [exportType, setExportType] = useState<ExportType>("requests");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const handleExportCSV = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      if (!token) {
        throw new Error("請先登入");
      }

      let data: any[] = [];
      let headers: string[] = [];
      let rows: string[][] = [];

      // 根據類型獲取數據
      if (exportType === "requests") {
        let q = query(collection(db, "requests"), orderBy("createdAt", "desc"));
        
        if (statusFilter !== "all") {
          q = query(q, where("status", "==", statusFilter));
        }

        const snapshot = await getDocs(q);
        data = snapshot.docs.map((doc) => {
          const docData = doc.data();
          return {
            id: doc.id,
            ...docData,
            createdAt: convertTimestamp(docData.createdAt),
            updatedAt: convertTimestamp(docData.updatedAt),
          };
        });

        // 日期篩選
        if (startDate || endDate) {
          data = data.filter((item) => {
            const itemDate = item.createdAt;
            if (!itemDate) return false;
            if (startDate && itemDate < new Date(startDate)) return false;
            if (endDate && itemDate > new Date(endDate)) return false;
            return true;
          });
        }

        headers = [
          "編號",
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
          "提交時間",
        ];

        rows = data.map((item) => [
          item.id.substring(0, 8),
          item.status,
          item.description?.replace(/[\n\r]/g, " ") || "",
          Array.isArray(item.fields) ? item.fields.join("、") : "",
          item.requester?.name || "",
          item.requester?.phone || "",
          item.requester?.age || "",
          item.requester?.district || "",
          item.urgency || "",
          item.serviceType || "",
          item.estimatedDuration || "",
          item.createdAt ? item.createdAt.toLocaleString("zh-TW") : "",
        ]);
      } else if (exportType === "volunteers") {
        let q = query(collection(db, "users"), where("role", "==", "volunteer"), orderBy("createdAt", "desc"));
        
        if (statusFilter !== "all") {
          q = query(q, where("status", "==", statusFilter));
        }

        const snapshot = await getDocs(q);
        data = snapshot.docs.map((doc) => {
          const docData = doc.data();
          return {
            uid: doc.id,
            ...docData,
            createdAt: convertTimestamp(docData.createdAt),
          };
        });

        // 日期篩選
        if (startDate || endDate) {
          data = data.filter((item) => {
            const itemDate = item.createdAt;
            if (!itemDate) return false;
            if (startDate && itemDate < new Date(startDate)) return false;
            if (endDate && itemDate > new Date(endDate)) return false;
            return true;
          });
        }

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
        ];

        rows = data.map((item) => [
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
        ]);
      } else if (exportType === "applications") {
        let q = query(collection(db, "applications"), orderBy("createdAt", "desc"));
        
        if (statusFilter !== "all") {
          q = query(q, where("status", "==", statusFilter));
        }

        const snapshot = await getDocs(q);
        data = snapshot.docs.map((doc) => {
          const docData = doc.data();
          return {
            id: doc.id,
            ...docData,
            createdAt: convertTimestamp(docData.createdAt),
          };
        });

        // 日期篩選
        if (startDate || endDate) {
          data = data.filter((item) => {
            const itemDate = item.createdAt;
            if (!itemDate) return false;
            if (startDate && itemDate < new Date(startDate)) return false;
            if (endDate && itemDate > new Date(endDate)) return false;
            return true;
          });
        }

        headers = [
          "報名ID",
          "委托ID",
          "義工ID",
          "狀態",
          "留言",
          "可服務時間",
          "報名時間",
        ];

        rows = data.map((item) => [
          item.id.substring(0, 8),
          item.requestId?.substring(0, 8) || "",
          item.volunteerId?.substring(0, 12) || "",
          item.status || "",
          item.message?.replace(/[\n\r]/g, " ") || "",
          item.availableTime || "",
          item.createdAt ? item.createdAt.toLocaleString("zh-TW") : "",
        ]);
      }

      // 生成 CSV
      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      // 添加 BOM 以支援中文
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${exportType}_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(`成功匯出 ${rows.length} 條記錄！`);
    } catch (err: any) {
      console.error("Export error:", err);
      alert("匯出失敗：" + (err.message || "請稍後再試"));
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    alert("Excel 匯出功能開發中，請先使用 CSV 格式。");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">數據匯出</h2>
        <p className="text-muted-foreground">匯出委托列表、義工列表或報名記錄為 CSV/Excel 格式</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>匯出設置</CardTitle>
          <CardDescription>選擇要匯出的數據類型和篩選條件</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 數據類型 */}
          <div className="space-y-2">
            <Label>數據類型</Label>
            <Select value={exportType} onValueChange={(v) => setExportType(v as ExportType)}>
              <SelectTrigger>
                <SelectValue placeholder="選擇數據類型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="requests">委托列表</SelectItem>
                <SelectItem value="volunteers">義工列表</SelectItem>
                <SelectItem value="applications">報名記錄</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 狀態篩選 */}
          <div className="space-y-2">
            <Label>狀態篩選</Label>
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

          {/* 日期範圍 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>開始日期</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>結束日期</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

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
            <Button onClick={handleExportExcel} variant="outline" disabled className="flex-1">
              匯出為 Excel (開發中)
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p className="font-semibold mb-2">注意事項：</p>
            <ul className="list-disc list-inside space-y-1">
              <li>CSV 文件可使用 Excel 或 Google Sheets 打開</li>
              <li>匯出的數據包含敏感信息，請妥善保管</li>
              <li>日期範圍為選填，不填寫則匯出所有符合條件的記錄</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 快速操作 */}
      <Card>
        <CardHeader>
          <CardTitle>快速匯出</CardTitle>
          <CardDescription>一鍵匯出常用數據</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            onClick={() => {
              setExportType("requests");
              setStatusFilter("pending");
              setTimeout(handleExportCSV, 100);
            }}
            disabled={loading}
          >
            匯出待審核委托
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setExportType("volunteers");
              setStatusFilter("approved");
              setTimeout(handleExportCSV, 100);
            }}
            disabled={loading}
          >
            匯出已批准義工
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setExportType("applications");
              setStatusFilter("pending");
              setTimeout(handleExportCSV, 100);
            }}
            disabled={loading}
          >
            匯出待處理報名
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

