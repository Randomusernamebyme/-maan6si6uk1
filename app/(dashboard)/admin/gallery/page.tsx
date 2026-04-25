"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getAuthToken } from "@/lib/utils/auth";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  uploadedBy?: string;
}

interface GalleryFeedback {
  content: string;
  createdAt?: string;
  createdBy?: string;
  authorName?: string;
}

interface AdminGalleryItem {
  kind: "request" | "post";
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
  const [processingId, setProcessingId] = useState<string>("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string>("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [newFeedback, setNewFeedback] = useState("");
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<number, string>>({});
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createFields, setCreateFields] = useState("");
  const [createDescription, setCreateDescription] = useState("");

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeItemId) || null,
    [items, activeItemId]
  );

  const filteredItems = useMemo<AdminGalleryItem[]>(() => {
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
      if (!token) throw new Error("請先登入");
      const response = await fetch("/api/admin/gallery", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "載入 Gallery 管理資料失敗");
      }
      const data = await response.json();
      const nextItems = data.items || [];
      setItems(nextItems);
      return nextItems as AdminGalleryItem[];
    } catch (err: any) {
      setError(err.message || "載入 Gallery 管理資料失敗");
      return [] as AdminGalleryItem[];
    } finally {
      setLoading(false);
      setProcessingId("");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const patchItem = async (item: AdminGalleryItem, payload: any) => {
    const token = await getAuthToken();
    if (!token) throw new Error("請先登入");
    const endpoint =
      item.kind === "request"
        ? `/api/admin/requests/${item.id}`
        : `/api/admin/gallery/posts/${item.id}`;
    const response = await fetch(endpoint, {
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

  const createStandalonePost = async () => {
    const name = createName.trim();
    const description = createDescription.trim();
    const fields = createFields
      .split(/[、,，]/g)
      .map((v) => v.trim())
      .filter(Boolean);

    const token = await getAuthToken();
    if (!token) throw new Error("請先登入");
    const response = await fetch("/api/admin/gallery/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, description, fields }),
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "新增花絮貼文失敗");
    }
    const data = await response.json();
    return String(data.id || "");
  };

  const openEditor = (item: AdminGalleryItem) => {
    setActiveItemId(item.id);
    setPendingFiles([]);
    setNewFeedback("");
    setFeedbackDrafts(
      Object.fromEntries((item.galleryFeedbacks || []).map((feedback, idx) => [idx, feedback.content]))
    );
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setActiveItemId("");
    setPendingFiles([]);
    setNewFeedback("");
    setFeedbackDrafts({});
  };

  const handleTogglePublic = async (item: AdminGalleryItem) => {
    try {
      setProcessingId(item.id);
      if (item.kind === "request") {
        await patchItem(item, { isPublicGallery: !item.isPublicGallery });
      } else {
        await patchItem(item, { isPublic: !item.isPublicGallery });
      }
      await fetchData();
    } catch (err: any) {
      setError(err.message || "更新公開狀態失敗");
      setProcessingId("");
    }
  };

  const handleUploadPhotos = async () => {
    if (!activeItem || pendingFiles.length === 0) return;
    try {
      setProcessingId(activeItem.id);
      const token = await getAuthToken();
      if (!token) throw new Error("請先登入");

      const uploaded = await Promise.all(
        pendingFiles.map(async (file) => {
          const formData = new FormData();
          if (activeItem.kind === "request") {
            formData.append("requestId", activeItem.id);
          } else {
            formData.append("postId", activeItem.id);
          }
          formData.append("file", file);
          const response = await fetch("/api/admin/gallery/upload", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "上傳相片失敗");
          }
          const data = await response.json();
          return {
            url: data.url,
            uploadedAt: data.uploadedAt || new Date().toISOString(),
            uploadedBy: data.uploadedBy || user?.uid || "",
          };
        })
      );

      const nextPhotos = [...(activeItem.galleryPhotos || []), ...uploaded];
      if (activeItem.kind === "request") {
        await patchItem(activeItem, { galleryPhotos: nextPhotos });
      } else {
        await patchItem(activeItem, { photos: nextPhotos });
      }
      setPendingFiles([]);
      await fetchData();
    } catch (err: any) {
      setError(err.message || "上傳相片失敗");
      setProcessingId("");
    }
  };

  const handleDeletePhoto = async (photoIndex: number) => {
    if (!activeItem) return;
    try {
      setProcessingId(activeItem.id);
      const nextPhotos = activeItem.galleryPhotos.filter((_, idx) => idx !== photoIndex);
      if (activeItem.kind === "request") {
        await patchItem(activeItem, { galleryPhotos: nextPhotos });
      } else {
        await patchItem(activeItem, { photos: nextPhotos });
      }
      await fetchData();
    } catch (err: any) {
      setError(err.message || "刪除相片失敗");
      setProcessingId("");
    }
  };

  const handleAddFeedback = async () => {
    if (!activeItem) return;
    const content = newFeedback.trim();
    if (!content) return;
    try {
      setProcessingId(activeItem.id);
      const nextFeedback = {
        content,
        createdAt: new Date().toISOString(),
        createdBy: user?.uid || "",
        authorName: user?.displayName || "管理員",
      };
      const nextFeedbacks = [...(activeItem.galleryFeedbacks || []), nextFeedback];
      if (activeItem.kind === "request") {
        await patchItem(activeItem, { galleryFeedbacks: nextFeedbacks });
      } else {
        await patchItem(activeItem, { feedbacks: nextFeedbacks });
      }
      setNewFeedback("");
      await fetchData();
    } catch (err: any) {
      setError(err.message || "新增回饋失敗");
      setProcessingId("");
    }
  };

  const handleSaveFeedback = async (feedbackIndex: number) => {
    if (!activeItem) return;
    const newContent = (feedbackDrafts[feedbackIndex] || "").trim();
    if (!newContent) {
      setError("回饋內容不可留空");
      return;
    }
    try {
      setProcessingId(activeItem.id);
      const updatedFeedbacks = activeItem.galleryFeedbacks.map((feedback, idx) =>
        idx === feedbackIndex ? { ...feedback, content: newContent } : feedback
      );
      if (activeItem.kind === "request") {
        await patchItem(activeItem, { galleryFeedbacks: updatedFeedbacks });
      } else {
        await patchItem(activeItem, { feedbacks: updatedFeedbacks });
      }
      await fetchData();
    } catch (err: any) {
      setError(err.message || "更新回饋失敗");
      setProcessingId("");
    }
  };

  const handleDeleteFeedback = async (feedbackIndex: number) => {
    if (!activeItem) return;
    try {
      setProcessingId(activeItem.id);
      const nextFeedbacks = activeItem.galleryFeedbacks.filter((_, idx) => idx !== feedbackIndex);
      if (activeItem.kind === "request") {
        await patchItem(activeItem, { galleryFeedbacks: nextFeedbacks });
      } else {
        await patchItem(activeItem, { feedbacks: nextFeedbacks });
      }
      await fetchData();
    } catch (err: any) {
      setError(err.message || "刪除回饋失敗");
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
        <h2 className="text-2xl font-bold">展覽管理</h2>
        <p className="text-muted-foreground mt-1">
          以相片牆方式管理貼文（委托貼文 / 獨立花絮），點擊任一貼文可在彈窗中編輯、刪除相片與回饋。
        </p>
      </div>

      {error && <ErrorDisplay message={error} />}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          新增花絮貼文
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">貼文總數</p>
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
              <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
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

      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">找不到符合條件的委托。</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredItems.map((item) => {
            const cover = item.galleryPhotos?.[0]?.url;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openEditor(item)}
                className="text-left"
              >
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="relative w-full aspect-square bg-muted">
                      {cover ? (
                        <Image
                          src={cover}
                          alt={item.name || "管理貼文"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                          尚未上傳相片
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant={item.isPublicGallery ? "default" : "outline"}>
                          {item.isPublicGallery ? "公開中" : "未公開"}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-2 space-y-1">
                      <p className="text-sm font-medium truncate">
                        {item.name || item.fields.join("、") || "已完成委托"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        相片 {item.galleryPhotos?.length || 0} 張 / 回饋 {item.galleryFeedbacks?.length || 0} 則
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={isEditorOpen} onOpenChange={(open) => (!open ? closeEditor() : setIsEditorOpen(true))}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {activeItem && (
            <>
              <DialogHeader>
                <DialogTitle>{activeItem.name || activeItem.fields.join("、") || "已完成委托"}</DialogTitle>
                <DialogDescription>
                  直接管理貼文內容：公開狀態、上傳/刪除相片、編輯/刪除回饋。
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  {activeItem.fields.map((field) => (
                    <Badge key={field} variant="secondary">
                      {field}
                    </Badge>
                  ))}
                  {activeItem.completedAt && (
                    <Badge variant="outline">
                      完成於 {format(new Date(activeItem.completedAt), "yyyy年MM月dd日", { locale: zhTW })}
                    </Badge>
                  )}
                  <Badge variant={activeItem.isPublicGallery ? "default" : "outline"}>
                    {activeItem.isPublicGallery ? "公開中" : "未公開"}
                  </Badge>
                  <Badge variant="secondary">
                    {activeItem.kind === "request" ? "委托成果" : "獨立花絮"}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleTogglePublic(activeItem)}
                    disabled={processingId === activeItem.id}
                  >
                    {activeItem.isPublicGallery ? "取消公開" : "公開到 Gallery"}
                  </Button>
                  {activeItem.isPublicGallery && (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/gallery/${activeItem.id}`} target="_blank">
                        查看公開貼文
                      </Link>
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">相片管理</h4>
                  {activeItem.galleryPhotos.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {activeItem.galleryPhotos.map((photo, idx) => (
                        <div key={`${activeItem.id}-photo-${idx}`} className="space-y-2">
                          <div className="relative w-full aspect-square rounded-md overflow-hidden bg-muted">
                            <Image
                              src={photo.url}
                              alt={`相片 ${idx + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="w-full"
                            onClick={() => handleDeletePhoto(idx)}
                            disabled={processingId === activeItem.id}
                          >
                            刪除此相片
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">尚未上傳相片</p>
                  )}

                  <div className="space-y-2 pt-2">
                    <Input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => setPendingFiles(Array.from(e.target.files || []))}
                    />
                    <Button
                      size="sm"
                      onClick={handleUploadPhotos}
                      disabled={processingId === activeItem.id || pendingFiles.length === 0}
                    >
                      上傳新相片
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">回饋管理</h4>
                  {activeItem.galleryFeedbacks.length > 0 ? (
                    activeItem.galleryFeedbacks.map((feedback, idx) => (
                      <div key={`${activeItem.id}-feedback-${idx}`} className="rounded-md border p-3 space-y-2">
                        <Textarea
                          value={feedbackDrafts[idx] ?? feedback.content}
                          onChange={(e) =>
                            setFeedbackDrafts((prev) => ({ ...prev, [idx]: e.target.value }))
                          }
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSaveFeedback(idx)}
                            disabled={processingId === activeItem.id}
                          >
                            儲存修改
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteFeedback(idx)}
                            disabled={processingId === activeItem.id}
                          >
                            刪除此回饋
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">尚未新增回饋</p>
                  )}

                  <div className="space-y-2">
                    <Textarea
                      value={newFeedback}
                      onChange={(e) => setNewFeedback(e.target.value)}
                      placeholder="新增新的管理員回饋..."
                      rows={3}
                    />
                    <Button
                      size="sm"
                      onClick={handleAddFeedback}
                      disabled={processingId === activeItem.id || !newFeedback.trim()}
                    >
                      新增回饋
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>新增花絮貼文</DialogTitle>
            <DialogDescription>建立一篇不需綁定委托的 Gallery 花絮貼文。</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="貼文標題（可留空）"
            />
            <Input
              value={createFields}
              onChange={(e) => setCreateFields(e.target.value)}
              placeholder="服務類別（用 、 或 , 分隔，可留空）"
            />
            <Textarea
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              placeholder="貼文描述（可留空）"
              rows={4}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    setError("");
                    setProcessingId("creating");
                    const id = await createStandalonePost();
                    setIsCreateOpen(false);
                    setCreateName("");
                    setCreateFields("");
                    setCreateDescription("");
                    const nextItems = await fetchData();
                    const created = nextItems.find((it) => it.id === id && it.kind === "post");
                    if (created) openEditor(created);
                  } catch (err: any) {
                    setError(err.message || "新增花絮貼文失敗");
                  } finally {
                    setProcessingId("");
                  }
                }}
                disabled={processingId === "creating"}
              >
                建立貼文
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={processingId === "creating"}
              >
                取消
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

