"use client";

import { useEffect, useMemo, useState } from "react";
import { getAuthToken } from "@/lib/utils/auth";
import { useAuth } from "@/lib/hooks/useAuth";
import { storage } from "@/lib/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error";
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
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File[]>>({});
  const [feedbackInputs, setFeedbackInputs] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string>("");

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [items]);

  const fetchData = async () => {
    try {
      setError("");
      const token = await getAuthToken();
      if (!token) {
        throw new Error("請先登入");
      }
      const response = await fetch("/api/admin/gallery", {
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
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const filePath = `requests/${item.id}/gallery/${Date.now()}-${file.name}`;
          const fileRef = ref(storage, filePath);
          await uploadBytes(fileRef, file);
          const url = await getDownloadURL(fileRef);
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
          管理已完成委托的公開展示、成果相片與管理員回饋。
        </p>
      </div>

      {error && <ErrorDisplay message={error} />}

      {sortedItems.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            目前沒有已完成的委托可供管理。
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedItems.map((item) => (
            <Card key={item.id}>
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg">
                  {item.name || item.fields.join("、") || "已完成委托"}
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
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleTogglePublic(item)}
                    disabled={processingId === item.id}
                  >
                    {item.isPublicGallery ? "取消公開" : "公開到 Gallery"}
                  </Button>
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

