"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getAuthToken } from "@/lib/utils/auth";
import { useAuth } from "@/lib/hooks/useAuth";
import { storage } from "@/lib/firebase/config";
import { ref, uploadBytes } from "firebase/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import Image from "next/image";

interface GalleryPhoto {
  url: string;
  uploadedAt?: string;
  uploadedBy?: string;
}

interface GalleryFeedback {
  content: string;
  createdAt?: string;
  createdBy?: string;
  authorName?: string;
}

interface AdminGalleryItem {
  id: string;
  name: string;
  fields: string[];
  description: string;
  isPublicGallery?: boolean;
  completedAt?: string | null;
  galleryPhotos: GalleryPhoto[];
  galleryFeedbacks: GalleryFeedback[];
}

export default function AdminGalleryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<AdminGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<"all" | "public" | "private">("all");
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File[]>>({});
  const [feedbackInputs, setFeedbackInputs] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string>("");

  const sortedItems = useMemo<AdminGalleryItem[]>(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return [...items]
      .filter((item) => {
        if (filter === "public") return !!item.isPublicGallery;
        if (filter === "private") return !item.isPublicGallery;
        return true;
      })
      .filter((item) => {
        if (!normalizedKeyword) return true;
        const target = `${item.name} ${item.description} ${(item.fields || []).join(" ")}`.toLowerCase();
        return target.includes(normalizedKeyword);
      })
      .sort((a, b) => {
      const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return bTime - aTime;
      });
  }, [items, filter, keyword]);

  const summary = useMemo(() => {
    const total = items.length;
    const publicCount = items.filter((item) => item.isPublicGallery).length;
    const totalPhotos = items.reduce((sum, item) => sum + (item.galleryPhotos?.length || 0), 0);
    const totalFeedbacks = items.reduce((sum, item) => sum + (item.galleryFeedbacks?.length || 0), 0);
    return { total, publicCount, totalPhotos, totalFeedbacks };
  }, [items]);

  const fetchData = async () => {
    try {
      setError("");
      const token = await getAuthToken();
      if (!token) {
        throw new Error("請先登入");
      }
      const response = await fetch("/api/admin/gallery", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "載入 Gallery 管理資料失敗");
      }
      const data = await response.json();
      setItems(data.items || []);
    } catch (err: any) {
      setError(err.message || "載入 Gallery 管理資料失敗");
    } finally {
      setLoading(false);
      setProcessingId("");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const patchRequest = async (requestId: string, payload: any) => {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("請先登入");
    }
    const response = await fetch(`/api/admin/requests/${requestId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "更新失敗");
    }
  };

  const handleTogglePublic = async (item: AdminGalleryItem) => {
    try {
      setProcessingId(item.id);
      await patchRequest(item.id, { isPublicGallery: !item.isPublicGallery });
      await fetchData();
    } catch (err: any) {
      setError(err.message || "更新公開狀態失敗");
      setProcessingId("");
    }
  };

  const handleUploadPhotos = async (item: AdminGalleryItem) => {
    const files = selectedFiles[item.id] || [];
    if (files.length === 0) return;

    try {
      setProcessingId(item.id);
      const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
      if (!bucket) {
        throw new Error("缺少 Firebase Storage bucket 設定");
      }

      const uploaded = await Promise.all(
        files.map(async (file) => {
          const safeFileName = file.name.replace(/\s+/g, "_");
          const filePath = `requests/${item.id}/gallery/${Date.now()}-${safeFileName}`;
          const downloadToken = crypto.randomUUID();
          const fileRef = ref(storage, filePath);
          await uploadBytes(fileRef, file, {
            contentType: file.type || "image/jpeg",
            cacheControl: "public,max-age=31536000",
            customMetadata: {
              firebaseStorageDownloadTokens: downloadToken,
            },
          });
          const url = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(
            filePath
          )}?alt=media&token=${downloadToken}`;
          return {
            url,
            uploadedAt: new Date().toISOString(),
            uploadedBy: user?.uid || "",
          };
        })
      );

      await patchRequest(item.id, {
        galleryPhotos: [...(item.galleryPhotos || []), ...uploaded],
      });

      setSelectedFiles((prev) => ({ ...prev, [item.id]: [] }));
      await fetchData();
    } catch (err: any) {
      setError(err.message || "上傳相片失敗");
      setProcessingId("");
    }
  };

  const handleAddFeedback = async (item: AdminGalleryItem) => {
    const content = (feedbackInputs[item.id] || "").trim();
    if (!content) return;
    try {
      setProcessingId(item.id);
      const newFeedback = {
        content,
        createdAt: new Date().toISOString(),
        createdBy: user?.uid || "",
        authorName: user?.displayName || "管理員",
      };
      await patchRequest(item.id, {
        galleryFeedbacks: [...(item.galleryFeedbacks || []), newFeedback],
      });
      setFeedbackInputs((prev) => ({ ...prev, [item.id]: "" }));
      await fetchData();
    } catch (err: any) {
      setError(err.message || "新增回饋失敗");
      setProcessingId("");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gallery 管理</h2>
        <p className="text-muted-foreground mt-1">
          管理已完成委托的公開展示、成果相片與管理員回饋，可直接檢查已發佈內容。
        </p>
      </div>

      {error && <ErrorDisplay message={error} />}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">已完成委托</p>
            <p className="text-2xl font-bold">{summary.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">公開貼文</p>
            <p className="text-2xl font-bold">{summary.publicCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">已上傳相片</p>
            <p className="text-2xl font-bold">{summary.totalPhotos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">已發佈回饋</p>
            <p className="text-2xl font-bold">{summary.totalFeedbacks}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜尋委托名稱、內容或服務類別..."
              className="md:col-span-2"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={filter === "all" ? "default" : "outline"}
                onClick={() => setFilter("all")}
              >
                全部
              </Button>
              <Button
                size="sm"
                variant={filter === "public" ? "default" : "outline"}
                onClick={() => setFilter("public")}
              >
                已公開
              </Button>
              <Button
                size="sm"
                variant={filter === "private" ? "default" : "outline"}
                onClick={() => setFilter("private")}
              >
                未公開
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {sortedItems.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            找不到符合條件的委托。
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedItems.map((item) => (
            <Card key={item.id}>
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg">
                  {item.isPublicGallery ? (
                    <Link href={`/gallery/${item.id}`} target="_blank" className="underline-offset-4 hover:underline">
                      {item.name || item.fields.join("、") || "已完成委托"}
                    </Link>
                  ) : (
                    <span>{item.name || item.fields.join("、") || "已完成委托"}</span>
                  )}
                </CardTitle>
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
                  <Badge variant={item.isPublicGallery ? "default" : "outline"}>
                    {item.isPublicGallery ? "公開中" : "未公開"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleTogglePublic(item)}
                    disabled={processingId === item.id}
                  >
                    {item.isPublicGallery ? "取消公開" : "公開到 Gallery"}
                  </Button>
                  {item.isPublicGallery && (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/gallery/${item.id}`} target="_blank">
                        查看公開貼文
                      </Link>
                    </Button>
                  )}
                </div>
                {!item.isPublicGallery && (
                  <p className="text-xs text-amber-600">
                    目前為未公開狀態：即使已上傳相片/回饋，前台 Gallery 也不會顯示。
                  </p>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-medium">已發佈內容預覽</p>
                  {item.galleryPhotos?.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {item.galleryPhotos.slice(0, 5).map((photo, idx) => (
                        <div
                          key={`${item.id}-preview-${idx}`}
                          className="relative w-full aspect-square rounded-md overflow-hidden bg-muted"
                        >
                          <Image
                            src={photo.url}
                            alt={`已上傳相片 ${idx + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">尚未上傳相片</p>
                  )}

                  {item.galleryFeedbacks?.length > 0 ? (
                    <div className="space-y-2">
                      {item.galleryFeedbacks.slice(0, 2).map((feedback, idx) => (
                        <div key={`${item.id}-preview-feedback-${idx}`} className="rounded-md border p-2 text-xs">
                          {feedback.content}
                        </div>
                      ))}
                      {item.galleryFeedbacks.length > 2 && (
                        <p className="text-xs text-muted-foreground">
                          另有 {item.galleryFeedbacks.length - 2} 則回饋
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">尚未新增回饋</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">上傳成果相片（僅管理員）</label>
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setSelectedFiles((prev) => ({ ...prev, [item.id]: files }));
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUploadPhotos(item)}
                    disabled={processingId === item.id || !(selectedFiles[item.id]?.length)}
                  >
                    上傳相片
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">新增管理員回饋</label>
                  <Textarea
                    value={feedbackInputs[item.id] || ""}
                    onChange={(e) =>
                      setFeedbackInputs((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    placeholder="輸入會顯示在公開 Gallery 的回饋內容..."
                    rows={3}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddFeedback(item)}
                    disabled={processingId === item.id || !(feedbackInputs[item.id] || "").trim()}
                  >
                    新增回饋
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  目前相片 {item.galleryPhotos?.length || 0} 張，回饋 {item.galleryFeedbacks?.length || 0} 則
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

