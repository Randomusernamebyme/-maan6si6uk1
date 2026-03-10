"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
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

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

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
          以相片牆方式展示已完成並公開的委托成果，點擊可查看完整貼文。
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
              <Link key={item.id} href={`/gallery/${item.id}`} className="block">
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
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

