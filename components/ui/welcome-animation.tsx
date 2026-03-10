"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

interface WelcomeAnimationProps {
  onComplete?: () => void;
}

export function WelcomeAnimation({ onComplete }: WelcomeAnimationProps) {
  const [show, setShow] = useState(true);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // 觸發進場動畫
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setAnimate(false);
    setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, 200);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div
        className={`relative text-center space-y-4 transition-all duration-500 ${
          animate ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <button
          type="button"
          aria-label="關閉"
          onClick={handleClose}
          className="absolute -right-2 -top-2 rounded-full bg-background/90 p-1 shadow hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex justify-center">
          <div
            className={`rounded-full bg-primary p-6 transition-all duration-500 ${
              animate ? "scale-100 rotate-0" : "scale-0 rotate-180"
            }`}
          >
            <CheckCircle2 className="h-16 w-16 text-primary-foreground" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">感謝報名！</h2>
          <p className="text-lg text-muted-foreground">
            我們會在一週內 WhatsApp 聯絡你安排面試
          </p>
          <p className="text-sm text-muted-foreground">
            如畫面上有顯示任何編號或重要資料，請<span className="font-semibold">複製或截圖</span>保存。
          </p>
        </div>
      </div>
    </div>
  );
}


