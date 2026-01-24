"use client";

import { useState, useEffect, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Request } from "@/types";
import { convertTimestamp } from "@/lib/firebase/firestore";
import { getAuthToken } from "@/lib/utils/auth";

export function useRequest(requestId: string | null) {
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const useApiRef = useRef(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!requestId) {
      setLoading(false);
      return;
    }

    // 先嘗試直接從 Firestore 讀取
    const unsubscribe = onSnapshot(
      doc(db, "requests", requestId),
      (snapshot) => {
        if (snapshot.exists()) {
          const docData = snapshot.data();
          setRequest({
            id: snapshot.id,
            ...docData,
            createdAt: convertTimestamp(docData.createdAt),
            updatedAt: convertTimestamp(docData.updatedAt),
            matchedAt: docData.matchedAt
              ? convertTimestamp(docData.matchedAt)
              : undefined,
            completedAt: docData.completedAt
              ? convertTimestamp(docData.completedAt)
              : undefined,
          } as Request);
          setLoading(false);
          setError(null);
          useApiRef.current = false;
          // 如果之前在使用 API 輪詢，清除它
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        } else {
          setRequest(null);
          setLoading(false);
        }
      },
      async (err: any) => {
        // 如果權限不足，使用 API 獲取並設置輪詢
        if (err?.code === "permission-denied" || err?.code === "PERMISSION_DENIED") {
          useApiRef.current = true;
          
          const fetchViaAPI = async () => {
            try {
              const token = await getAuthToken();
              if (token) {
                const response = await fetch(`/api/volunteer/requests/${requestId}`, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });

                if (response.ok) {
                  const data = await response.json();
                  setRequest({
                    ...data,
                    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
                    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
                    matchedAt: data.matchedAt ? new Date(data.matchedAt) : undefined,
                    completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
                    followUps: data.followUps ? data.followUps.map((followUp: any) => ({
                      ...followUp,
                      date: followUp.date ? new Date(followUp.date) : new Date(),
                    })) : undefined,
                  } as Request);
                  setLoading(false);
                  setError(null);
                } else {
                  throw new Error("API 請求失敗");
                }
              }
            } catch (apiErr) {
              console.error("Error fetching request via API:", apiErr);
              if (loading) {
                setError(apiErr as Error);
                setLoading(false);
              }
            }
          };

          // 立即獲取一次
          await fetchViaAPI();

          // 設置輪詢以保持同步（每 5 秒更新一次）
          if (!pollingIntervalRef.current) {
            pollingIntervalRef.current = setInterval(fetchViaAPI, 5000);
          }
          
          return;
        }
        
        console.error("Error fetching request:", err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [requestId]);

  return { request, loading, error };
}


