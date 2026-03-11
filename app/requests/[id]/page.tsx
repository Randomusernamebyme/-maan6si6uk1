"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

interface PublicRequestItem {
  id: string;
  name: string;
  description: string;
  fields: string[];
  urgency?: "urgent" | "normal";
  serviceType?: string;
  estimatedDuration?: string;
  appreciation?: string;
  status: string;
  createdAt?: string | null;
}

export default function PublicRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [item, setItem] = useState<PublicRequestItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareMessage, setShareMessage] = useState("");

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/requests/${params.id}`;
  }, [params.id]);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await fetch(`/api/public/requests/${params.id}`, { cache: "no-store" });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "載入委托失敗");
        }
        const data = await response.json();
        setItem(data);
      } catch (err: any) {
        setError(err.message || "載入委托失敗");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchDetail();
    }
  }, [params.id]);

  const handleShare = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMessage("已複製分享連結");
    } catch {
      setShareMessage("無法自動複製，請手動複製網址");
    }
    setTimeout(() => setShareMessage(""), 2500);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-center py-12">
          <Loading size="lg" />
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="container mx-auto px-4 py-10 space-y-4">
        <ErrorDisplay message={error || "找不到此委托"} />
        <Button asChild variant="outline">
          <Link href="/">返回首頁</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/">返回首頁</Link>
        </Button>
        <Button variant="outline" size="sm" onClick={handleShare}>
          分享此委托
        </Button>
      </div>

      {shareMessage && <p className="text-sm text-muted-foreground">{shareMessage}</p>}

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>{item.name || item.fields.join("、") || "公開委托"}</CardTitle>
          <CardDescription>此頁為公開資訊，已隱藏委托者個人資料</CardDescription>
          <div className="flex flex-wrap gap-2">
            {item.fields.map((field) => (
              <Badge key={field} variant="secondary">
                {field}
              </Badge>
            ))}
            {item.urgency === "urgent" && <Badge variant="destructive">緊急</Badge>}
            {item.createdAt && (
              <Badge variant="outline">
                發布於 {format(new Date(item.createdAt), "yyyy年MM月dd日", { locale: zhTW })}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <h3 className="font-semibold mb-2">需求描述</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.description}</p>
          </div>

          {item.serviceType && (
            <div>
              <h3 className="font-semibold mb-2">服務形式</h3>
              <p className="text-sm text-muted-foreground">{item.serviceType}</p>
            </div>
          )}

          {item.estimatedDuration && (
            <div>
              <h3 className="font-semibold mb-2">預計時長</h3>
              <p className="text-sm text-muted-foreground">{item.estimatedDuration}</p>
            </div>
          )}

          {item.appreciation && (
            <div>
              <h3 className="font-semibold mb-2">回報方式</h3>
              <p className="text-sm text-muted-foreground">{item.appreciation}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">申請此委托</CardTitle>
          <CardDescription>申請前需要登入或註冊義工帳號</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {authLoading ? (
            <Loading size="sm" />
          ) : !user ? (
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/login">登入後申請</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/register">註冊義工帳號</Link>
              </Button>
            </div>
          ) : (
            <Button asChild>
              <Link href={`/volunteer/requests/${item.id}`}>前往委托頁面申請</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
