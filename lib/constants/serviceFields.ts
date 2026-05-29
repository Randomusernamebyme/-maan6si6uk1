import { ServiceField } from "@/types";

// 服務領域圖片 URL
export const SERVICE_FIELD_IMAGES: Record<ServiceField, string> = {
  "生活助手": "/api/service-fields/1",
  "街坊樹窿": "/api/service-fields/2",
  "社區拍檔": "/api/service-fields/3",
};

// 三大服務範疇背景色（按指定順序）s
export const SERVICE_FIELD_BACKGROUNDS: Record<ServiceField, string> = {
  "生活助手": "#aa4515",
  "社區拍檔": "#fbb657",
  "街坊樹窿": "#efcb9e",
};

// 服務領域信息
export const SERVICE_FIELD_INFO: Record<ServiceField, { subtitle: string; description: string }> = {
  "生活助手": {
    subtitle: "河裡 - 全能工具人",
    description: "幫助街坊解決生活難題：手機故障處理、修補舊衣舊鞋、執靚小窩、教用AI等",
  },
  "社區拍檔": {
    subtitle: "小仙子拍檔",
    description: "聯繫社區形形色色的人，舉辦地區聯繫活動、保留社區特色文化，為堅尼地城增添色彩和溫情",
  },
  "街坊樹窿": {
    subtitle: "小松鼠",
    description: "提供情緒價值，聆聽心底秘密：上門陪玩、陪行街、陪睇醫生，打從心底陪伴",
  },
};
