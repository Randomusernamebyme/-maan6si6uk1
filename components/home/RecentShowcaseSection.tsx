"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

interface GalleryPhoto {
  url: string;
  uploadedAt?: string;
}

interface GalleryFeedback {
  content: string;
  createdAt?: string;
  authorName?: string;
}

interface GalleryItem {
  id: string;
  name: string;
  fields: string[];
  description: string;
  completedAt?: string | null;
  galleryPhotos: GalleryPhoto[];
  galleryFeedbacks: GalleryFeedback[];
}

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

export function RecentShowcaseSection() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [requestItems, setRequestItems] = useState<PublicRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [activeGalleryId, setActiveGalleryId] = useState("");
  const activeGallery = useMemo(
    () => galleryItems.find((item) => item.id === activeGalleryId) || null,
    [galleryItems, activeGalleryId]
  );

  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState<PublicRequestItem | null>(null);

  const clearRequestQuery = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("requestId");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const openRequestDialog = useCallback(
    async (requestId: string) => {
      const existing = requestItems.find((item) => item.id === requestId);
      if (existing) {
        setActiveRequest(existing);
        setIsRequestOpen(true);
        return;
      }

      const response = await fetch(`/api/public/requests/${requestId}`, { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      if (data?.id) {
        setActiveRequest(data);
        setIsRequestOpen(true);
      }
    },
    [requestItems]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [galleryRes, requestsRes] = await Promise.all([
          fetch("/api/gallery", { cache: "no-store" }),
          fetch("/api/public/requests?limit=3", { cache: "no-store" }),
        ]);
        const galleryData = galleryRes.ok ? await galleryRes.json() : { items: [] };
        const requestData = requestsRes.ok ? await requestsRes.json() : { items: [] };
        setGalleryItems(galleryData.items || []);
        setRequestItems(requestData.items || []);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const requestId = searchParams.get("requestId");
    if (!requestId || loading) return;
    openRequestDialog(requestId);
  }, [searchParams, loading, openRequestDialog]);

  return (
    <section className="py-16 bg-muted/20">
      <div className="container mx-auto px-4 space-y-10">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">最近成果</h2>
          <p className="text-muted-foreground mt-2">點擊卡片即可查看完整相片與內容。</p>
          {loading ? (
            <div className="py-8">
              <Loading size="sm" />
            </div>
          ) : galleryItems.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-4">暫時未有公開成果。</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-4 max-w-5xl">
              {galleryItems.slice(0, 4).map((item) => {
                const cover = item.galleryPhotos?.[0]?.url;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="text-left"
                    onClick={() => {
                      setActiveGalleryId(item.id);
                      setIsGalleryOpen(true);
                    }}
                  >
                    <Card className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-0">
                        <div className="relative w-full aspect-square bg-muted">
                          {cover ? (
                            <Image src={cover} alt={item.name || "成果貼文"} fill className="object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                              尚未上傳相片
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-sm font-medium truncate">
                            {item.name || item.fields.join("、") || "成果貼文"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl md:text-3xl font-bold">最近開放申請委托</h2>
          <p className="text-muted-foreground mt-2">點擊委托查看詳情，申請前請先登入或註冊。</p>
          {loading ? (
            <div className="py-8">
              <Loading size="sm" />
            </div>
          ) : requestItems.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-4">暫時未有開放申請委托。</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-3 mt-4 items-stretch max-w-5xl">
              {requestItems.slice(0, 3).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="text-left h-full min-h-0 flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onClick={() => {
                    setActiveRequest(item);
                    setIsRequestOpen(true);
                  }}
                >
                  <Card className="hover:shadow-md transition-shadow h-full w-full flex flex-col">
                    <CardHeader className="space-y-2 pb-2 shrink-0">
                      <CardTitle className="text-base leading-snug line-clamp-2 min-h-[2.75rem]">
                        {item.name || item.fields.join("、") || "公開委托"}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2 min-h-[1.75rem] items-center">
                        {item.fields.slice(0, 3).map((field) => (
                          <Badge key={`${item.id}-${field}`} variant="secondary">
                            {field}
                          </Badge>
                        ))}
                        {item.urgency === "urgent" && <Badge variant="destructive">緊急</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 flex-1 flex flex-col">
                      <div className="min-h-[4.5rem] flex-1">
                        <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {activeGallery && (
            <>
              <DialogHeader>
                <DialogTitle>{activeGallery.name || activeGallery.fields.join("、") || "成果貼文"}</DialogTitle>
                <DialogDescription>展覽貼文內容</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {activeGallery.fields.map((field) => (
                    <Badge key={field} variant="secondary">
                      {field}
                    </Badge>
                  ))}
                  {activeGallery.completedAt && (
                    <Badge variant="outline">
                      完成於 {format(new Date(activeGallery.completedAt), "yyyy年MM月dd日", { locale: zhTW })}
                    </Badge>
                  )}
                </div>

                {activeGallery.description && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{activeGallery.description}</p>
                )}

                {activeGallery.galleryPhotos.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {activeGallery.galleryPhotos.map((photo, idx) => (
                      <div key={`${activeGallery.id}-${idx}`} className="relative w-full h-64 rounded-md overflow-hidden bg-muted">
                        <Image src={photo.url} alt={`成果相片 ${idx + 1}`} fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {activeGallery.galleryFeedbacks.length > 0 && (
                  <div className="space-y-2">
                    {activeGallery.galleryFeedbacks.map((feedback, idx) => (
                      <div key={`${activeGallery.id}-feedback-${idx}`} className="rounded-md border p-3 text-sm">
                        <p className="whitespace-pre-wrap">{feedback.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isRequestOpen}
        onOpenChange={(open) => {
          setIsRequestOpen(open);
          if (!open) {
            clearRequestQuery();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {activeRequest && (
            <>
              <DialogHeader>
                <DialogTitle>{activeRequest.name || activeRequest.fields.join("、") || "公開委托"}</DialogTitle>
                <DialogDescription>委托詳情</DialogDescription>
              </DialogHeader>
              <div className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  {activeRequest.fields.map((field) => (
                    <Badge key={`${activeRequest.id}-${field}`} variant="secondary">
                      {field}
                    </Badge>
                  ))}
                  {activeRequest.urgency === "urgent" && <Badge variant="destructive">緊急</Badge>}
                  {activeRequest.createdAt && (
                    <Badge variant="outline">
                      發布於 {format(new Date(activeRequest.createdAt), "yyyy年MM月dd日", { locale: zhTW })}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{activeRequest.description}</p>

                {activeRequest.serviceType && (
                  <p className="text-sm text-muted-foreground">服務形式：{activeRequest.serviceType}</p>
                )}
                {activeRequest.estimatedDuration && (
                  <p className="text-sm text-muted-foreground">預計時長：{activeRequest.estimatedDuration}</p>
                )}
                {activeRequest.appreciation && (
                  <p className="text-sm text-muted-foreground">回報方式：{activeRequest.appreciation}</p>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  {authLoading ? (
                    <Loading size="sm" />
                  ) : !user ? (
                    <>
                      <Button asChild>
                        <Link href="/login">登入後申請</Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href="/register">註冊義工帳號</Link>
                      </Button>
                    </>
                  ) : (
                    <Button asChild>
                      <Link href={`/volunteer/requests/${activeRequest.id}`}>前往委托頁面申請</Link>
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
