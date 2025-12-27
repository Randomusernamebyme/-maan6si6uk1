"use client";

import { useRequests } from "@/lib/hooks/useRequests";
import { RequestCard } from "@/components/requests/RequestCard";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error";
import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { createDocument } from "@/lib/firebase/firestore";
import { Application } from "@/types";
import { useRouter } from "next/navigation";

export default function VolunteerDashboardPage() {
  const { requests, loading, error } = useRequests("open");
  const { user } = useAuth();
  const router = useRouter();
  const [applying, setApplying] = useState<string | null>(null);

  const handleApply = async (requestId: string) => {
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      setApplying(requestId);
      await createDocument<Application>("applications", {
        requestId,
        volunteerId: user.uid,
        status: "pending",
      });
      router.refresh();
      alert("報名成功！");
    } catch (err: any) {
      console.error("報名失敗:", err);
      alert("報名失敗：" + (err.message || "請稍後再試"));
    } finally {
      setApplying(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay message="載入委托列表時發生錯誤" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">可報名的委托</h2>
        <p className="text-muted-foreground">
          以下是目前開放報名的委托，您可以選擇適合的委托進行報名。
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">目前沒有開放報名的委托</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onApply={handleApply}
              showRequesterInfo={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

