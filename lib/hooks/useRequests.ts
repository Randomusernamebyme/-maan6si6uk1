"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Request, RequestStatus } from "@/types";
import { convertTimestamp } from "@/lib/firebase/firestore";

export function useRequests(status?: RequestStatus) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let q = query(
      collection(db, "requests"),
      orderBy("createdAt", "desc")
    );

    if (status) {
      q = query(q, where("status", "==", status));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const docData = doc.data();
          return {
            id: doc.id,
            ...docData,
            createdAt: convertTimestamp(docData.createdAt),
            updatedAt: convertTimestamp(docData.updatedAt),
            matchedAt: docData.matchedAt
              ? convertTimestamp(docData.matchedAt)
              : undefined,
            completedAt: docData.completedAt
              ? convertTimestamp(docData.completedAt)
              : undefined,
          } as Request;
        });
        setRequests(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching requests:", err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [status]);

  return { requests, loading, error };
}

