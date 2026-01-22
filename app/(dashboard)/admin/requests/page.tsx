"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Request, RequestStatus, ServiceField } from "@/types";
import { convertTimestamp } from "@/lib/firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { getAuthToken } from "@/lib/utils/auth";
import { useRouter } from "next/navigation";

const STATUS_TABS: RequestStatus[] = ["pending", "open", "published", "matched", "in-progress", "completed", "cancelled"];
const STATUS_LABELS: Record<RequestStatus, string> = {
  pending: "待審核",
  open: "已批准",
  published: "已發布",
  matched: "已配對",
  "in-progress": "進行中",
  completed: "已完成",
  cancelled: "已取消",
};

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [statusFilter, setStatusFilter] = useState<RequestStatus>("pending");
  const [fieldFilter, setFieldFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [showBatchEditDialog, setShowBatchEditDialog] = useState(false);
  const [batchAction, setBatchAction] = useState<string>("");
  const [batchProcessing, setBatchProcessing] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "requests")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const data = snapshot.docs.map((doc) => {
            const docData = doc.data();
            return {
              id: doc.id,
              ...docData,
              createdAt: convertTimestamp(docData.createdAt) || new Date(),
              updatedAt: convertTimestamp(docData.updatedAt) || new Date(),
              matchedAt: docData.matchedAt ? convertTimestamp(docData.matchedAt) : undefined,
              completedAt: docData.completedAt ? convertTimestamp(docData.completedAt) : undefined,
              // 確保必要欄位有預設值
              status: docData.status || "pending",
              fields: Array.isArray(docData.fields) ? docData.fields : [],
              description: docData.description || "",
              requester: docData.requester || { name: "未知", email: "", phone: "" },
            } as Request;
          });
          
          // 手動排序
          data.sort((a, b) => {
            if (!a.createdAt || !b.createdAt) return 0;
            return b.createdAt.getTime() - a.createdAt.getTime();
          });
          
          setRequests(data);
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error("Error processing requests data:", err);
          setError(err as Error);
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error fetching requests:", err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      // 過濾已合併的委托
      if (request.isMerged) return false;

      // 狀態篩選
      if (request.status !== statusFilter) return false;

      // 領域篩選
      if (fieldFilter !== "all" && Array.isArray(request.fields) && !request.fields.includes(fieldFilter as ServiceField)) {
        return false;
      }

      // 搜尋
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          (request.description || "").toLowerCase().includes(query) ||
          (request.requester?.name || "").toLowerCase().includes(query) ||
          (Array.isArray(request.fields) && request.fields.some((f) => String(f).toLowerCase().includes(query)));
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [requests, statusFilter, fieldFilter, searchQuery]);

  const formatDate = (date: Date | undefined | null) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return "無效日期";
    }
    return format(date, "yyyy年MM月dd日 HH:mm", { locale: zhTW });
  };

  const toggleSelect = (requestId: string) => {
    const newSelected = new Set(selectedRequests);
    if (newSelected.has(requestId)) {
      newSelected.delete(requestId);
    } else {
      newSelected.add(requestId);
    }
    setSelectedRequests(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedRequests.size === filteredRequests.length) {
      setSelectedRequests(new Set());
    } else {
      setSelectedRequests(new Set(filteredRequests.map((r) => r.id)));
    }
  };

  const handleBatchEdit = async () => {
    if (selectedRequests.size === 0) return;
    if (!batchAction) {
      alert("請選擇要執行的操作");
      return;
    }

    try {
      setBatchProcessing(true);
      const token = await getAuthToken();
      if (!token) {
        throw new Error("請先登入");
      }

      if (batchAction === "merge") {
        if (selectedRequests.size < 2) {
          alert("請至少選擇2個委托進行合併");
          setBatchProcessing(false);
          return;
        }

        const selectedArray = Array.from(selectedRequests);
        const mainRequestId = selectedArray[0];
        const mergeRequestIds = selectedArray.slice(1);

        const response = await fetch("/api/admin/requests/merge", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            mainRequestId,
            mergeRequestIds,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "合併失敗");
        }
      } else {
        // 批量更新狀態
        const statusMap: Record<string, string> = {
          approve: "open",
          publish: "published",
          cancel: "cancelled",
        };

        const newStatus = statusMap[batchAction];
        if (!newStatus) {
          throw new Error("無效的操作");
        }

        const updatePromises = Array.from(selectedRequests).map(async (requestId) => {
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
        });

        await Promise.all(updatePromises);
      }

      setSelectedRequests(new Set());
      setShowBatchEditDialog(false);
      setBatchAction("");
      router.refresh();
    } catch (err: any) {
      alert("批量操作失敗：" + (err.message || "請稍後再試"));
    } finally {
      setBatchProcessing(false);
    }
  };

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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">委托管理</h2>
        {selectedRequests.size > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBatchEditDialog(true)}
            disabled={batchProcessing}
          >
            批量編輯 ({selectedRequests.size})
          </Button>
        )}
      </div>

      {/* 篩選和搜尋 */}
      <Card>
        <CardHeader>
          <CardTitle>篩選和搜尋</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="搜尋標題/描述/委托者姓名..."
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
          </div>
        </CardContent>
      </Card>

      {/* 狀態分頁 */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as RequestStatus)}>
        <TabsList className="grid w-full grid-cols-7">
          {STATUS_TABS.map((status) => (
            <TabsTrigger key={status} value={status}>
              {STATUS_LABELS[status]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={statusFilter} className="mt-6">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">目前沒有{STATUS_LABELS[statusFilter]}的委托</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 表格標題 */}
              <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 rounded-md font-semibold text-sm">
                <div className="col-span-1">
                  <input
                    type="checkbox"
                    checked={selectedRequests.size === filteredRequests.length && filteredRequests.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4"
                  />
                </div>
                <div className="col-span-1">編號</div>
                <div className="col-span-2">委托者</div>
                <div className="col-span-2">領域</div>
                <div className="col-span-2">提交時間</div>
                <div className="col-span-2">狀態</div>
                <div className="col-span-2">操作</div>
              </div>

              {/* 表格內容 */}
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="grid grid-cols-12 gap-4 p-4 border rounded-md hover:bg-muted/30 transition-colors"
                >
                  <div className="col-span-1 flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedRequests.has(request.id)}
                      onChange={() => toggleSelect(request.id)}
                      className="h-4 w-4"
                    />
                  </div>
                  <div className="col-span-1 flex items-center text-sm font-mono">
                    {request.id.substring(0, 8)}
                  </div>
                  <div className="col-span-2 flex items-center text-sm">
                    {request.requester?.name || "未知"}
                  </div>
                  <div className="col-span-2 flex items-center">
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(request.fields) && request.fields.length > 0 ? (
                        request.fields.map((field) => (
                          <Badge key={field} variant="secondary" className="text-xs">
                            {field}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">無</span>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center text-sm text-muted-foreground">
                    {formatDate(request.createdAt)}
                  </div>
                  <div className="col-span-2 flex items-center">
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
                    >
                      {STATUS_LABELS[request.status]}
                    </Badge>
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/requests/${request.id}`}>查看詳情</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 批量編輯對話框 */}
      <Dialog open={showBatchEditDialog} onOpenChange={setShowBatchEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批量編輯</DialogTitle>
            <DialogDescription>
              已選擇 {selectedRequests.size} 個委托，請選擇要執行的操作
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>選擇操作</Label>
              <Select value={batchAction} onValueChange={setBatchAction}>
                <SelectTrigger>
                  <SelectValue placeholder="請選擇操作" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">批量審核（改為已批准）</SelectItem>
                  <SelectItem value="publish">批量發布（改為已發布）</SelectItem>
                  <SelectItem value="cancel">批量取消</SelectItem>
                  <SelectItem value="merge" disabled={selectedRequests.size < 2}>
                    批量合併 {selectedRequests.size < 2 && "（需要至少2個委托）"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBatchEditDialog(false);
                setBatchAction("");
              }}
              disabled={batchProcessing}
            >
              取消
            </Button>
            <Button onClick={handleBatchEdit} disabled={batchProcessing || !batchAction}>
              {batchProcessing ? <Loading size="sm" /> : "確認執行"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


