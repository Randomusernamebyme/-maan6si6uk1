"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

interface WelcomeAnimationProps {
  onComplete?: () => void;
}

export function WelcomeAnimation({ onComplete }: WelcomeAnimationProps) {
  const [show, setShow] = useState(true);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // 觸發動畫
    setTimeout(() => setAnimate(true), 100);
    
    // 3秒後隱藏
    const timer = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div
        className={`text-center space-y-4 transition-all duration-500 ${
          animate ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
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
        </div>
      </div>
    </div>
  );
}

