"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
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
import Link from "next/link";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { getAuthToken } from "@/lib/utils/auth";
import { useRouter } from "next/navigation";

const STATUS_TABS: UserStatus[] = ["pending", "approved", "rejected", "suspended"];
const STATUS_LABELS: Record<UserStatus, string> = {
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
  const [statusFilter, setStatusFilter] = useState<UserStatus>("pending");
  const [fieldFilter, setFieldFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVolunteers, setSelectedVolunteers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const q = query(
      collection(db, "users"),
      where("role", "==", "volunteer"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const docData = doc.data();
          return {
            uid: doc.id,
            ...docData,
            createdAt: convertTimestamp(docData.createdAt),
            updatedAt: convertTimestamp(docData.updatedAt),
            interviewDate: docData.interviewDate ? convertTimestamp(docData.interviewDate) : undefined,
            lastLoginAt: docData.lastLoginAt ? convertTimestamp(docData.lastLoginAt) : undefined,
          } as User;
        });
        setVolunteers(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching volunteers:", err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredVolunteers = useMemo(() => {
    return volunteers.filter((volunteer) => {
      // 狀態篩選
      if (volunteer.status !== statusFilter) return false;

      // 領域篩選
      if (fieldFilter !== "all" && volunteer.fields && !volunteer.fields.includes(fieldFilter as ServiceField)) {
        return false;
      }

      // 搜尋
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          volunteer.displayName.toLowerCase().includes(query) ||
          volunteer.email.toLowerCase().includes(query) ||
          (volunteer.skills && volunteer.skills.some((s) => s.toLowerCase().includes(query)));
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [volunteers, statusFilter, fieldFilter, searchQuery]);

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

  const formatDate = (date: Date) => {
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
          <Button variant="outline" size="sm">
            批量批准
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
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as UserStatus)}>
        <TabsList className="grid w-full grid-cols-4">
          {STATUS_TABS.map((status) => (
            <TabsTrigger key={status} value={status}>
              {STATUS_LABELS[status]}
            </TabsTrigger>
          ))}
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
                <div className="col-span-1">選擇</div>
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
                      onChange={() => {
                        const newSelected = new Set(selectedVolunteers);
                        if (newSelected.has(volunteer.uid)) {
                          newSelected.delete(volunteer.uid);
                        } else {
                          newSelected.add(volunteer.uid);
                        }
                        setSelectedVolunteers(newSelected);
                      }}
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
                      {volunteer.fields?.map((field) => (
                        <Badge key={field} variant="secondary" className="text-xs">
                          {field}
                        </Badge>
                      ))}
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
    </div>
  );
}

