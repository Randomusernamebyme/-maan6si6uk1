"use client";

import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SERVICE_FIELD_IMAGES, SERVICE_FIELD_INFO } from "@/lib/constants/serviceFields";
import { ServiceField } from "@/types";

export function ServicesSection() {
  const serviceFields: ServiceField[] = ["生活助手", "社區拍檔", "街坊樹窿"];

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
          {serviceFields.map((field) => {
            const info = SERVICE_FIELD_INFO[field];
            return (
              <Card key={field} className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={SERVICE_FIELD_IMAGES[field]}
                      alt={field}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <CardTitle className="text-xl">{field}</CardTitle>
                  <CardDescription>{info.subtitle}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {info.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}


