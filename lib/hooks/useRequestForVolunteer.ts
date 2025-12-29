"use client";

import { useState, useEffect } from "react";
import { Request } from "@/types";
import { getAuthToken } from "@/lib/utils/auth";

export function useRequestForVolunteer(requestId: string | null) {
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!requestId) {
      setLoading(false);
      return;
    }

    const fetchRequest = async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          throw new Error("請先登入");
        }

        const response = await fetch(`/api/volunteer/requests/${requestId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "獲取委托詳情失敗");
        }

        const data = await response.json();
        setRequest({
          ...data,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
          matchedAt: data.matchedAt ? new Date(data.matchedAt) : undefined,
          completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
        } as Request);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching request:", err);
        setError(err as Error);
        setRequest(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId]);

  return { request, loading, error };
}

