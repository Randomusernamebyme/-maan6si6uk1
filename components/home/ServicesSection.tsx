"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SERVICE_FIELD_IMAGES } from "@/lib/constants/serviceFields";
import { getStorageDownloadURL } from "@/lib/utils/storage";

export function ServicesSection() {
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    // 嘗試從 Firebase Storage 獲取圖片 URL
    const loadImages = async () => {
      const imagePaths = {
        "生活助手": "service-fields/1.png",
        "社區拍檔": "service-fields/3.png",
        "街坊樹窿": "service-fields/2.png",
      };

      const urls: Record<string, string> = {};
      
      for (const [key, path] of Object.entries(imagePaths)) {
        try {
          const url = await getStorageDownloadURL(path);
          urls[key] = url;
        } catch (error) {
          console.error(`Failed to load image for ${key}:`, error);
          // 如果獲取失敗，使用硬編碼的 URL 作為備用
          urls[key] = SERVICE_FIELD_IMAGES[key] || "";
        }
      }
      
      setImageUrls(urls);
    };

    loadImages();
  }, []);

  const services = [
    {
      title: "生活助手",
      subtitle: "河裡 - 全能工具人",
      description: "幫助街坊解決生活難題：手機故障處理、修補舊衣舊鞋、執靚小窩、教用AI等",
      imageUrl: imageUrls["生活助手"] || SERVICE_FIELD_IMAGES["生活助手"],
    },
    {
      title: "社區拍檔",
      subtitle: "小仙子拍檔",
      description: "聯繫社區形形色色的人，舉辦地區聯繫活動、保留社區特色文化，為堅尼地城增添色彩和溫情",
      imageUrl: imageUrls["社區拍檔"] || SERVICE_FIELD_IMAGES["社區拍檔"],
    },
    {
      title: "街坊樹窿",
      subtitle: "小松鼠",
      description: "提供情緒價值，聆聽心底秘密：上門陪玩、陪行街、陪睇醫生，打從心底陪伴",
      imageUrl: imageUrls["街坊樹窿"] || SERVICE_FIELD_IMAGES["街坊樹窿"],
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">三大服務領域</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            我們透過三個不同的品牌角色，為社區提供全方位的支援服務
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {services.map((service) => (
            <Card key={service.title} className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-muted">
                  {service.imageUrl ? (
                    <Image
                      src={service.imageUrl}
                      alt={service.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      unoptimized
                      onError={(e) => {
                        console.error("Failed to load image:", service.title, service.imageUrl);
                        // 如果圖片加載失敗，可以顯示佔位符
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <span>圖片加載中...</span>
                    </div>
                  )}
                </div>
                <CardTitle className="text-xl">{service.title}</CardTitle>
                <CardDescription>{service.subtitle}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {service.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}


