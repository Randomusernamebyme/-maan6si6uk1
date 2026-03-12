import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

interface ErrorDisplayProps {
  message?: string;
  className?: string;
}

function toUserFriendlyMessage(message?: string) {
  if (!message) return "暫時未能完成，請稍後再試。";
  const raw = message.trim();
  const technicalKeywords = [
    "firebase",
    "firestore",
    "token",
    "permission",
    "unauthorized",
    "forbidden",
    "network",
    "cors",
    "api",
    "sdk",
    "server",
    "timeout",
    "500",
    "502",
    "503",
  ];
  const lower = raw.toLowerCase();
  if (technicalKeywords.some((keyword) => lower.includes(keyword))) {
    return "暫時未能完成，請稍後再試。";
  }
  return raw;
}

export function ErrorDisplay({ message = "發生錯誤，請稍後再試", className }: ErrorDisplayProps) {
  const safeMessage = toUserFriendlyMessage(message);
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive",
        className
      )}
    >
      <AlertCircle className="h-5 w-5" />
      <p className="text-sm">{safeMessage}</p>
    </div>
  );
}

export function ErrorPage({ message }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <ErrorDisplay message={message} className="max-w-md" />
    </div>
  );
}


