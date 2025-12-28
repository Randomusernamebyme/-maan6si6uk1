"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

interface SuccessAnimationProps {
  trackingNumber?: string;
  onComplete?: () => void;
}

export function SuccessAnimation({ trackingNumber, onComplete }: SuccessAnimationProps) {
  const [show, setShow] = useState(true);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // 觸發動畫
    setTimeout(() => setAnimate(true), 100);
    
    // 5秒後隱藏
    const timer = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, 5000);

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
          <h2 className="text-3xl font-bold">提交成功！</h2>
          {trackingNumber && (
            <p className="text-lg text-muted-foreground">
              追蹤編號：<span className="font-mono font-semibold">{trackingNumber}</span>
            </p>
          )}
          <p className="text-lg text-muted-foreground">
            我們會在 3 個工作日內聯絡您
          </p>
        </div>
      </div>
    </div>
  );
}


