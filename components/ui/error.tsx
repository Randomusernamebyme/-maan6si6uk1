import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

interface ErrorDisplayProps {
  message?: string;
  className?: string;
}

export function ErrorDisplay({ message = "發生錯誤，請稍後再試", className }: ErrorDisplayProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive",
        className
      )}
    >
      <AlertCircle className="h-5 w-5" />
      <p className="text-sm">{message}</p>
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


