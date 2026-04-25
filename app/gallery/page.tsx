"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error";
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

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [activePostId, setActivePostId] = useState("");

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const response = await fetch("/api/gallery", { cache: "no-store" });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "載入 Gallery 失敗");
        }
        const data = await response.json();
        setItems(data.items || []);
      } catch (err: any) {
        setError(err.message || "載入 Gallery 失敗");
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  const activePost = items.find((item) => item.id === activePostId) || null;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const postId = new URLSearchParams(window.location.search).get("postId");
    if (!postId || items.length === 0) return;
    const exists = items.some((item) => item.id === postId);
    if (exists) {
      setActivePostId(postId);
      setIsPostOpen(true);
    }
  }, [items]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-center py-12">
          <Loading size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-10">
        <ErrorDisplay message={error} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">成果 Gallery</h1>
        <p className="text-muted-foreground mt-2">
          以相片牆方式展示公開的成果與花絮貼文，點擊可查看完整貼文。
        </p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            暫時未有公開成果
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((item) => {
            const cover = item.galleryPhotos?.[0]?.url;
            return (
              <button
                key={item.id}
                type="button"
                className="block text-left"
                onClick={() => {
                  setActivePostId(item.id);
                  setIsPostOpen(true);
                }}
              >
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="relative w-full aspect-square bg-muted">
                      {cover ? (
                        <Image
                          src={cover}
                          alt={item.name || "成果貼文"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                          尚未上傳相片
                        </div>
                      )}
                    </div>
                    <div className="p-2 space-y-1">
                      <p className="text-sm font-medium truncate">
                        {item.name || item.fields.join("、") || "已完成委托"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.completedAt
                          ? format(new Date(item.completedAt), "yyyy/MM/dd", { locale: zhTW })
                          : "未記錄完成日期"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      <Dialog
        open={isPostOpen}
        onOpenChange={(open) => {
          setIsPostOpen(open);
          if (!open) {
            if (typeof window === "undefined") return;
            const params = new URLSearchParams(window.location.search);
            params.delete("postId");
            const query = params.toString();
            const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
            window.history.replaceState({}, "", nextUrl);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {activePost && (
            <>
              <DialogHeader>
                <DialogTitle>{activePost.name || activePost.fields.join("、") || "成果貼文"}</DialogTitle>
                <DialogDescription>已完成並公開的委托成果內容</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {activePost.fields.map((field) => (
                    <Badge key={field} variant="secondary">
                      {field}
                    </Badge>
                  ))}
                  {activePost.completedAt && (
                    <Badge variant="outline">
                      完成於 {format(new Date(activePost.completedAt), "yyyy年MM月dd日", { locale: zhTW })}
                    </Badge>
                  )}
                </div>

                {activePost.description && (
                  <div>
                    <h3 className="font-semibold mb-2">公開基本資訊</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{activePost.description}</p>
                  </div>
                )}

                {activePost.galleryPhotos.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">管理員上傳相片</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {activePost.galleryPhotos.map((photo, idx) => (
                        <div
                          key={`${activePost.id}-photo-${idx}`}
                          className="relative w-full h-64 rounded-md overflow-hidden bg-muted"
                        >
                          <Image
                            src={photo.url}
                            alt={`成果相片 ${idx + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activePost.galleryFeedbacks.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">管理員回饋</h3>
                    <div className="space-y-2">
                      {activePost.galleryFeedbacks.map((feedback, idx) => (
                        <div key={`${activePost.id}-feedback-${idx}`} className="rounded-md border p-3 text-sm">
                          <p className="whitespace-pre-wrap">{feedback.content}</p>
                          {feedback.createdAt && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(new Date(feedback.createdAt), "yyyy年MM月dd日 HH:mm", { locale: zhTW })}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const shareUrl = `${window.location.origin}/gallery?postId=${activePost.id}`;
                    await navigator.clipboard.writeText(shareUrl);
                  }}
                >
                  複製貼文連結
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

