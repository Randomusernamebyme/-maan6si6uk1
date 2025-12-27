"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Request } from "@/types";
import { convertTimestamp } from "@/lib/firebase/firestore";

export function useRequest(requestId: string | null) {
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!requestId) {
      setLoading(false);
      return;
    }

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
        } else {
          setRequest(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching request:", err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [requestId]);

  return { request, loading, error };
}

