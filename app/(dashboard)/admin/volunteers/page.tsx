"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { User, UserStatus, ServiceField } from "@/types";
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
import { Loading } from "@/components/ui/loading";
import Link from "next/link";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { getAuthToken } from "@/lib/utils/auth";
import { useRouter } from "next/navigation";

const STATUS_TABS: (UserStatus | "all")[] = ["all", "pending", "approved", "rejected", "suspended"];
const STATUS_LABELS: Record<UserStatus | "all", string> = {
  all: "全部",
  pending: "待審核",
  approved: "已批准",
  rejected: "已拒絕",
  suspended: "已暫停",
};

export default function AdminVolunteersPage() {
  const router = useRouter();
  const [volunteers, setVolunteers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("pending");
  const [fieldFilter, setFieldFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVolunteers, setSelectedVolunteers] = useState<Set<string>>(new Set());
  const [showBatchEditDialog, setShowBatchEditDialog] = useState(false);
  const [batchStatus, setBatchStatus] = useState<string>("");
  const [batchProcessing, setBatchProcessing] = useState(false);

  useEffect(() => {
    const fetchVolunteers = async () => {
      try {
        const q = query(
          collection(db, "users"),
          where("role", "==", "volunteer")
        );

        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            try {
              const data = snapshot.docs.map((doc) => {
                const docData = doc.data();
                return {
                  uid: doc.id,
                  ...docData,
                  createdAt: convertTimestamp(docData.createdAt) || new Date(),
                  updatedAt: convertTimestamp(docData.updatedAt) || new Date(),
                  interviewDate: docData.interviewDate ? convertTimestamp(docData.interviewDate) : undefined,
                  lastLoginAt: docData.lastLoginAt ? convertTimestamp(docData.lastLoginAt) : undefined,
                  // 確保必要欄位有預設值
                  displayName: docData.displayName || "未知",
                  email: docData.email || "",
                  status: docData.status || "pending",
                  fields: Array.isArray(docData.fields) ? docData.fields : [],
                  skills: Array.isArray(docData.skills) ? docData.skills : [],
                } as User;
              });
              
              // 手動排序
              data.sort((a, b) => {
                if (!a.createdAt || !b.createdAt) return 0;
                return b.createdAt.getTime() - a.createdAt.getTime();
              });
              
              setVolunteers(data);
              setLoading(false);
              setError(null);
            } catch (err) {
              console.error("Error processing volunteers data:", err);
              setError(err as Error);
              setLoading(false);
            }
          },
          (err) => {
            console.error("Error fetching volunteers:", err);
            setError(err as Error);
            setLoading(false);
          }
        );

        return () => unsubscribe();
      } catch (err) {
        console.error("Error setting up volunteers listener:", err);
        setError(err as Error);
        setLoading(false);
      }
    };

    fetchVolunteers();
  }, []);

  const filteredVolunteers = useMemo(() => {
    return volunteers.filter((volunteer) => {
      // 狀態篩選
      if (statusFilter !== "all" && volunteer.status !== statusFilter) return false;

      // 領域篩選
      if (fieldFilter !== "all" && volunteer.fields && !volunteer.fields.includes(fieldFilter as ServiceField)) {
        return false;
      }

      // 搜尋
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          (volunteer.displayName || "").toLowerCase().includes(query) ||
          (volunteer.email || "").toLowerCase().includes(query) ||
          (Array.isArray(volunteer.skills) && volunteer.skills.some((s) => String(s).toLowerCase().includes(query)));
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [volunteers, statusFilter, fieldFilter, searchQuery]);

  const toggleSelectVolunteer = (volunteerId: string) => {
    const newSelected = new Set(selectedVolunteers);
    if (newSelected.has(volunteerId)) {
      newSelected.delete(volunteerId);
    } else {
      newSelected.add(volunteerId);
    }
    setSelectedVolunteers(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedVolunteers.size === filteredVolunteers.length) {
      setSelectedVolunteers(new Set());
    } else {
      setSelectedVolunteers(new Set(filteredVolunteers.map((v) => v.uid)));
    }
  };

  const handleBatchEdit = async () => {
    if (selectedVolunteers.size === 0) return;
    if (!batchStatus) {
      alert("請選擇要更改的狀態");
      return;
    }

    try {
      setBatchProcessing(true);
      const token = await getAuthToken();
      if (!token) {
        throw new Error("請先登入");
      }

      const newStatus = batchStatus as UserStatus;
      if (!["pending", "approved", "rejected", "suspended"].includes(newStatus)) {
        throw new Error("無效的狀態");
      }

      const updatePromises = Array.from(selectedVolunteers).map(async (volunteerId) => {
        const response = await fetch(`/api/admin/volunteers/${volunteerId}`, {
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

      setSelectedVolunteers(new Set());
      setShowBatchEditDialog(false);
      setBatchStatus("");
      router.refresh();
      alert(`成功更新 ${selectedVolunteers.size} 個義工的狀態！`);
    } catch (err: any) {
      alert("批量操作失敗：" + (err.message || "請稍後再試"));
    } finally {
      setBatchProcessing(false);
    }
  };

  const handleStatusChange = async (volunteerId: string, newStatus: UserStatus, notes?: string) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error("請先登入");
      }

      const updateData: any = { status: newStatus };
      if (notes) {
        if (newStatus === "approved") {
          updateData.interviewNotes = notes;
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

      router.refresh();
    } catch (err: any) {
      alert("更新失敗：" + (err.message || "請稍後再試"));
    }
  };

  const formatDate = (date: Date | undefined | null) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return "無效日期";
    }
    return format(date, "yyyy年MM月dd日", { locale: zhTW });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay message="載入義工列表時發生錯誤" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">義工管理</h2>
        {selectedVolunteers.size > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBatchEditDialog(true)}
          >
            批量編輯 ({selectedVolunteers.size})
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
              placeholder="搜尋姓名/Email/技能..."
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
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as UserStatus | "all")}>
        <TabsList className="grid w-full grid-cols-5">
          {STATUS_TABS.map((status) => {
            const count = status === "all" 
              ? volunteers.length 
              : volunteers.filter((v) => v.status === status).length;
            return (
              <TabsTrigger key={status} value={status}>
                {STATUS_LABELS[status]} ({count})
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={statusFilter} className="mt-6">
          {filteredVolunteers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">目前沒有{STATUS_LABELS[statusFilter]}的義工</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 表格標題 */}
              <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 rounded-md font-semibold text-sm">
                <div className="col-span-1">
                  <input
                    type="checkbox"
                    checked={selectedVolunteers.size === filteredVolunteers.length && filteredVolunteers.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4"
                  />
                </div>
                <div className="col-span-2">姓名</div>
                <div className="col-span-2">Email</div>
                <div className="col-span-2">領域</div>
                <div className="col-span-2">報名時間</div>
                <div className="col-span-1">狀態</div>
                <div className="col-span-2">操作</div>
              </div>

              {/* 表格內容 */}
              {filteredVolunteers.map((volunteer) => (
                <div
                  key={volunteer.uid}
                  className="grid grid-cols-12 gap-4 p-4 border rounded-md hover:bg-muted/30 transition-colors"
                >
                  <div className="col-span-1 flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedVolunteers.has(volunteer.uid)}
                      onChange={() => toggleSelectVolunteer(volunteer.uid)}
                      className="h-4 w-4"
                    />
                  </div>
                  <div className="col-span-2 flex items-center text-sm font-medium">
                    {volunteer.displayName}
                  </div>
                  <div className="col-span-2 flex items-center text-sm text-muted-foreground">
                    {volunteer.email}
                  </div>
                  <div className="col-span-2 flex items-center">
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(volunteer.fields) && volunteer.fields.length > 0 ? (
                        volunteer.fields.map((field) => (
                          <Badge key={field} variant="secondary" className="text-xs">
                            {field}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">無</span>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center text-sm text-muted-foreground">
                    {formatDate(volunteer.createdAt)}
                  </div>
                  <div className="col-span-1 flex items-center">
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
                  <div className="col-span-2 flex items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/volunteers/${volunteer.uid}`}>查看詳情</Link>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>批量編輯義工</DialogTitle>
            <DialogDescription>
              已選擇 {selectedVolunteers.size} 個義工，請選擇要更改的狀態
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>選擇新狀態 *</Label>
              <Select value={batchStatus} onValueChange={setBatchStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="請選擇狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">待審核</SelectItem>
                  <SelectItem value="approved">已批准</SelectItem>
                  <SelectItem value="rejected">已拒絕</SelectItem>
                  <SelectItem value="suspended">已暫停</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                將把選中的 {selectedVolunteers.size} 個義工的狀態更改為所選狀態
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBatchEditDialog(false);
                setBatchStatus("");
              }}
              disabled={batchProcessing}
            >
              取消
            </Button>
            <Button
              onClick={handleBatchEdit}
              disabled={batchProcessing || !batchStatus}
            >
              {batchProcessing ? (
                <>
                  <Loading size="sm" className="mr-2" />
                  處理中...
                </>
              ) : (
                "確認執行"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


