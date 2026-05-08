"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { getAuthToken } from "@/lib/utils/auth";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error";

type BrandingAssetKey = "logo" | "hero" | "character1" | "character2" | "character3";

const ASSETS: Array<{
  key: BrandingAssetKey;
  title: string;
  hint: string;
  previewUrl: string;
  recommended: string;
}> = [
  {
    key: "logo",
    title: "Logo（Header）",
    hint: "會覆寫網站 Header logo 的 Cloudinary public_id",
    previewUrl: "/api/branding/logo",
    recommended: "建議 PNG / SVG（透明背景）",
  },
  {
    key: "hero",
    title: "Hero（首頁）",
    hint: "會覆寫網站首頁 hero 的 Cloudinary public_id",
    previewUrl: "/api/branding/hero",
    recommended: "建議 1920×540（或同等比例）",
  },
  {
    key: "character1",
    title: "角色 1（生活助手）",
    hint: "對應 /api/service-fields/1",
    previewUrl: "/api/service-fields/1",
    recommended: "建議 PNG（透明背景）",
  },
  {
    key: "character2",
    title: "角色 2（社區拍檔）",
    hint: "對應 /api/service-fields/2",
    previewUrl: "/api/service-fields/2",
    recommended: "建議 PNG（透明背景）",
  },
  {
    key: "character3",
    title: "角色 3（街坊樹窿）",
    hint: "對應 /api/service-fields/3",
    previewUrl: "/api/service-fields/3",
    recommended: "建議 PNG（透明背景）",
  },
];

export default function AdminBrandingUploadPage() {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState<BrandingAssetKey | "">("");
  const [files, setFiles] = useState<Partial<Record<BrandingAssetKey, File | null>>>({});
  const [uploadedUrl, setUploadedUrl] = useState<Partial<Record<BrandingAssetKey, string>>>({});
  const [uploadedAt, setUploadedAt] = useState<Partial<Record<BrandingAssetKey, string>>>({});

  const isAuthed = !!user;

  const hasAnyFile = useMemo(() => {
    return ASSETS.some((a) => !!files[a.key]);
  }, [files]);

  const uploadOne = async (asset: BrandingAssetKey) => {
    try {
      setError("");
      const file = files[asset];
      if (!file) throw new Error("請先選擇檔案");
      const token = await getAuthToken();
      if (!token) throw new Error("請先登入");

      setBusyKey(asset);
      const formData = new FormData();
      formData.append("asset", asset);
      formData.append("file", file);

      const res = await fetch("/api/admin/branding/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "上傳失敗");
      }
      const data = await res.json();

      setUploadedUrl((prev) => ({ ...prev, [asset]: String(data.url || "") }));
      setUploadedAt((prev) => ({ ...prev, [asset]: String(data.uploadedAt || new Date().toISOString()) }));

      // 讓 next/image 的 /api/* 302 重新抓到更新後的 Cloudinary
      setTimeout(() => {
        const bust = `?t=${Date.now()}`;
        const img = new window.Image();
        img.src = `${ASSETS.find((a) => a.key === asset)?.previewUrl}${bust}`;
      }, 0);
    } catch (err: any) {
      setError(err.message || "上傳失敗");
    } finally {
      setBusyKey("");
    }
  };

  const uploadAll = async () => {
    for (const asset of ASSETS) {
      if (files[asset.key]) {
        // eslint-disable-next-line no-await-in-loop
        await uploadOne(asset.key);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Branding 圖片暫時上傳工具</h1>
        <p className="text-sm text-muted-foreground mt-2">
          這個頁面會以 admin 權限把圖片上傳到 Cloudinary，並「覆寫」既有 public_id（用來快速救回首頁 branding）。
        </p>
      </div>

      {!isAuthed ? (
        <ErrorDisplay message="請先登入 admin 帳號後再使用此頁。" />
      ) : null}
      {error ? <ErrorDisplay message={error} /> : null}

      <div className="flex items-center gap-3">
        <Button onClick={uploadAll} disabled={!isAuthed || !hasAnyFile || !!busyKey}>
          {busyKey ? "上傳中…" : "一鍵上傳已選擇的全部"}
        </Button>
        {busyKey ? <Loading /> : null}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {ASSETS.map((asset) => {
          const file = files[asset.key] || null;
          const lastUrl = uploadedUrl[asset.key] || "";
          const lastAt = uploadedAt[asset.key] || "";
          const isBusy = busyKey === asset.key;

          return (
            <Card key={asset.key} className="border-2">
              <CardHeader>
                <CardTitle className="text-lg">{asset.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{asset.hint}</p>
                <p className="text-xs text-muted-foreground">{asset.recommended}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden border bg-background">
                  <Image
                    src={asset.previewUrl}
                    alt={asset.title}
                    fill
                    className="object-contain p-3"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>

                <div className="space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const next = e.target.files?.[0] || null;
                      setFiles((prev) => ({ ...prev, [asset.key]: next }));
                    }}
                  />
                  <div className="text-xs text-muted-foreground">
                    目前選擇：{file ? file.name : "（未選擇）"}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => uploadOne(asset.key)}
                    disabled={!isAuthed || !file || !!busyKey}
                  >
                    {isBusy ? "上傳中…" : "上傳並覆寫"}
                  </Button>
                  {isBusy ? <Loading /> : null}
                </div>

                {lastUrl ? (
                  <div className="text-xs text-muted-foreground break-all">
                    最近上傳：{lastAt ? `${lastAt} ` : ""}{lastUrl}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

