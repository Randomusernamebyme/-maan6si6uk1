"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error";
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

export default function GalleryDetailPage() {
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<GalleryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/gallery/${params.id}`, { cache: "no-store" });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "載入貼文失敗");
        }
        const data = await response.json();
        setItem(data.item || null);
      } catch (err: any) {
        setError(err.message || "載入貼文失敗");
      } finally {
        setLoading(false);
      }
    };
    if (params.id) {
      fetchPost();
    }
  }, [params.id]);

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
        <ErrorDisplay message={error || "找不到此貼文"} />
        <Button asChild variant="outline">
          <Link href="/gallery">返回 Gallery</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 space-y-6">
      <Button asChild variant="outline" size="sm">
        <Link href="/gallery">返回 Gallery</Link>
      </Button>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>{item.name || item.fields.join("、") || "已完成委托"}</CardTitle>
          <div className="flex flex-wrap gap-2">
            {item.fields.map((field) => (
              <Badge key={field} variant="secondary">
                {field}
              </Badge>
            ))}
            {item.completedAt && (
              <Badge variant="outline">
                完成於 {format(new Date(item.completedAt), "yyyy年MM月dd日", { locale: zhTW })}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {item.description && (
            <div>
              <h3 className="font-semibold mb-2">公開基本資訊</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.description}</p>
            </div>
          )}

          {item.galleryPhotos.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">管理員上傳相片</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {item.galleryPhotos.map((photo, idx) => (
                  <div
                    key={`${item.id}-photo-${idx}`}
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

          {item.galleryFeedbacks.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">管理員回饋</h3>
              <div className="space-y-2">
                {item.galleryFeedbacks.map((feedback, idx) => (
                  <div key={`${item.id}-feedback-${idx}`} className="rounded-md border p-3 text-sm">
                    <p className="whitespace-pre-wrap">{feedback.content}</p>
                    {feedback.createdAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(feedback.createdAt), "yyyy年MM月dd日 HH:mm", {
                          locale: zhTW,
                        })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
