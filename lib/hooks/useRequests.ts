"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Request, RequestStatus } from "@/types";
import { convertTimestamp } from "@/lib/firebase/firestore";

export function useRequests(status?: RequestStatus | RequestStatus[]) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let q = query(collection(db, "requests"));

    if (status) {
      if (Array.isArray(status)) {
        // 如果傳入陣列，使用 in 查詢
        q = query(q, where("status", "in", status));
      } else {
        q = query(q, where("status", "==", status));
      }
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const data = snapshot.docs.map((doc) => {
            const docData = doc.data();
            return {
              id: doc.id,
              ...docData,
              createdAt: convertTimestamp(docData.createdAt) || new Date(),
              updatedAt: convertTimestamp(docData.updatedAt) || new Date(),
              matchedAt: docData.matchedAt
                ? convertTimestamp(docData.matchedAt)
                : undefined,
              completedAt: docData.completedAt
                ? convertTimestamp(docData.completedAt)
                : undefined,
            } as Request;
          });
          
          // 手動排序（最新優先）
          data.sort((a, b) => {
            if (!a.createdAt || !b.createdAt) return 0;
            return b.createdAt.getTime() - a.createdAt.getTime();
          });
          
          console.log(`獲取到 ${data.length} 條委托，狀態篩選: ${status || "全部"}`);
          setRequests(data);
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error("Error processing requests data:", err);
          setError(err as Error);
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error fetching requests:", err);
        console.error("Error details:", {
          code: err.code,
          message: err.message,
          status: status
        });
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [status]);

  return { requests, loading, error };
}

