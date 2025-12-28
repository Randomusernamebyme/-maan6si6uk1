"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ServicesSection() {
  const services = [
    {
      title: "生活助手",
      subtitle: "河裡 - 全能工具人",
      description: "幫助街坊解決生活難題：手機故障處理、修補舊衣舊鞋、執靚小窩、教用AI等",
      icon: "🔧",
    },
    {
      title: "社區拍檔",
      subtitle: "小仙子拍檔",
      description: "聯繫社區形形色色的人，舉辦地區聯繫活動、保留社區特色文化，為堅尼地城增添色彩和溫情",
      icon: "🤝",
    },
    {
      title: "街坊樹窿",
      subtitle: "小松鼠",
      description: "提供情緒價值，聆聽心底秘密：上門陪玩、陪行街、陪睇醫生，打從心底陪伴",
      icon: "💚",
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
                <div className="text-4xl mb-2">{service.icon}</div>
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


