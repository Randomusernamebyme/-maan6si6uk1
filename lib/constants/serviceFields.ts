import { ServiceField } from "@/types";

// 服務領域圖片 URL
export const SERVICE_FIELD_IMAGES: Record<ServiceField, string> = {
  "生活助手": "https://firebasestorage.googleapis.com/v0/b/maan6si6uk1.firebasestorage.app/o/service-fields%2F1.png?alt=media&token=e5b30fcb-3e76-4965-ac0e-c04ecc5f8e9c",
  "社區拍檔": "https://firebasestorage.googleapis.com/v0/b/maan6si6uk1.firebasestorage.app/o/service-fields%2F2.png?alt=media&token=4133eb66-66bc-44dd-859c-ec463fdb3d84",
  "街坊樹窿": "https://firebasestorage.googleapis.com/v0/b/maan6si6uk1.firebasestorage.app/o/service-fields%2F3.png?alt=media&token=a85c6f02-a0e5-4c53-a2f9-f0e77f4edccb",
};

// 三大服務範疇背景色（按指定順序）
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
