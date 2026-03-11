"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Request } from "@/types";
import { getAuthToken } from "@/lib/utils/auth";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { useApplications } from "@/lib/hooks/useApplications";
import Link from "next/link";

interface RequestDetailDialogProps {
  request: Request;
  userSkills: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequestDetailDialog({
  request,
  userSkills,
  open,
  onOpenChange,
}: RequestDetailDialogProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { applications } = useApplications(user?.uid);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [availableTime, setAvailableTime] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [shareMessage, setShareMessage] = useState("");

  const formatDate = (date: Date) => {
    return format(date, "yyyy年MM月dd日", { locale: zhTW });
  };

  // 檢查是否已報名及報名狀態
  const application = applications.find((app) => app.requestId === request.id);
  const hasApplied = !!application;
  const applicationStatus = application?.status;
  const volunteerStatus = user?.status;
  const canApply = !user || volunteerStatus === "approved";

  // 檢查技能匹配
  const matchingSkills = request.requiredSkills
    ? request.requiredSkills.filter((skill) => userSkills.includes(skill))
    : [];

  const handleApply = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (!availableTime.trim()) {
      setError("請填寫可服務時間");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess(false);

      const token = await getAuthToken();
      if (!token) {
        throw new Error("請先登入");
      }

      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestId: request.id,
          volunteerId: user.uid,
          availableTime: availableTime.trim(),
          message: message.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "報名失敗");
      }

      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "報名失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const shareUrl = `${window.location.origin}/requests/${request.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMessage("已複製委托分享連結");
    } catch {
      setShareMessage("無法自動複製，請手動複製網址");
    }
    setTimeout(() => setShareMessage(""), 2500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] md:w-full">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl md:text-2xl break-words">
                <Link 
                  href={`/volunteer/requests/${request.id}`}
                  className="hover:underline text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenChange(false);
                  }}
                >
                  {request.name || (Array.isArray(request.fields) && request.fields.length > 0
                    ? request.fields.join("、")
                    : "委托")}
                </Link>
              </DialogTitle>
              <DialogDescription className="mt-2 break-words">
                {request.urgency === "urgent" && (
                  <Badge variant="destructive">
                    緊急
                  </Badge>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* 需求描述 */}
          <div>
            <h3 className="font-semibold mb-2">需求描述</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
              {request.description}
            </p>
          </div>

          {/* 服務形式 */}
          {request.serviceType && (
            <div>
              <h3 className="font-semibold mb-2">服務形式</h3>
              <p className="text-sm text-muted-foreground break-words">{request.serviceType}</p>
            </div>
          )}

          {/* 預計時長 */}
          {request.estimatedDuration && (
            <div>
              <h3 className="font-semibold mb-2">預計時長</h3>
              <p className="text-sm text-muted-foreground break-words">{request.estimatedDuration}</p>
            </div>
          )}

          {/* 需要的技能 */}
          {request.requiredSkills && request.requiredSkills.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">需要的技能</h3>
              <div className="flex flex-wrap gap-2">
                {request.requiredSkills.map((skill) => {
                  const isMatching = userSkills.includes(skill);
                  return (
                    <Badge
                      key={skill}
                      variant={isMatching ? "default" : "secondary"}
                      className={`${isMatching ? "bg-green-600" : ""} flex-shrink-0`}
                    >
                      {skill}
                      {isMatching && " ✓"}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* 已報名人數 */}
          <div>
            <h3 className="font-semibold mb-2">已報名人數</h3>
            <p className="text-sm text-muted-foreground">
              {applications.filter((app) => app.requestId === request.id).length} 人已報名
            </p>
          </div>

          {/* 報名表單 */}
          <div className="space-y-2">
            <Button onClick={handleShare} variant="outline" className="w-full">
              分享此委托
            </Button>
            {shareMessage && (
              <p className="text-xs text-muted-foreground">{shareMessage}</p>
            )}
          </div>

          {!hasApplied && !success && (
            <>
              {!showApplicationForm ? (
                <>
                  {user && !canApply && (
                    <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 p-4 text-sm text-amber-800 dark:text-amber-200">
                      {volunteerStatus === "pending" && "您的義工帳號仍在審核中，暫時未能報名委托。"}
                      {volunteerStatus === "rejected" && "您的義工申請目前未獲通過，暫時未能報名委托。"}
                      {volunteerStatus === "suspended" && "您的義工帳號已被暫停，暫時未能報名委托。"}
                    </div>
                  )}
                  <Button
                    onClick={() => setShowApplicationForm(true)}
                    className="w-full"
                    disabled={!canApply}
                  >
                    報名此委托
                  </Button>
                </>
              ) : (
                <div className="space-y-4 border-t pt-4">
                  {error && <ErrorDisplay message={error} />}
                  {success && (
                    <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4 text-sm text-green-800 dark:text-green-200">
                      報名成功！團隊會盡快聯絡你
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="availableTime">可服務時間 *</Label>
                    <Input
                      id="availableTime"
                      value={availableTime}
                      onChange={(e) => setAvailableTime(e.target.value)}
                      placeholder="例如：每週六下午2-5點"
                      className="bg-background"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">留言（選填）</Label>
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="請輸入您的留言..."
                      rows={4}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowApplicationForm(false);
                        setAvailableTime("");
                        setMessage("");
                        setError("");
                      }}
                      className="flex-1"
                    >
                      取消
                    </Button>
                    <Button
                      onClick={handleApply}
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? <Loading size="sm" /> : "提交報名"}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {hasApplied && (
            <div className={`rounded-md p-4 text-sm ${
              applicationStatus === "approved" 
                ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200"
                : applicationStatus === "rejected"
                ? "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"
                : applicationStatus === "completed"
                ? "bg-gray-50 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200"
                : "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200"
            }`}>
              {applicationStatus === "approved" && "✓ 您已被選中！請留意 WhatsApp，團隊會聯絡你"}
              {applicationStatus === "rejected" && "您的報名未被選中"}
              {applicationStatus === "completed" && "✓ 此委托已完成"}
              {(!applicationStatus || applicationStatus === "pending") && "您已報名此委托，等待審核中"}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


