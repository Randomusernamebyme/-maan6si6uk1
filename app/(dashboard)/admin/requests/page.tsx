"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
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
import Link from "next/link";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

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

  useEffect(() => {
    const q = query(
      collection(db, "requests"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const docData = doc.data();
          return {
            id: doc.id,
            ...docData,
            createdAt: convertTimestamp(docData.createdAt),
            updatedAt: convertTimestamp(docData.updatedAt),
            matchedAt: docData.matchedAt ? convertTimestamp(docData.matchedAt) : undefined,
            completedAt: docData.completedAt ? convertTimestamp(docData.completedAt) : undefined,
          } as Request;
        });
        setRequests(data);
        setLoading(false);
        setError(null);
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
      if (fieldFilter !== "all" && !request.fields.includes(fieldFilter as ServiceField)) {
        return false;
      }

      // 搜尋
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          request.description.toLowerCase().includes(query) ||
          request.requester.name.toLowerCase().includes(query) ||
          request.fields.some((f) => f.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [requests, statusFilter, fieldFilter, searchQuery]);

  const formatDate = (date: Date) => {
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
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              批量審核
            </Button>
            <Button variant="outline" size="sm">
              批量合併
            </Button>
          </div>
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
                    {request.requester.name}
                  </div>
                  <div className="col-span-2 flex items-center">
                    <div className="flex flex-wrap gap-1">
                      {request.fields.map((field) => (
                        <Badge key={field} variant="secondary" className="text-xs">
                          {field}
                        </Badge>
                      ))}
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
    </div>
  );
}

