"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Application } from "@/types";
import { convertTimestamp } from "@/lib/firebase/firestore";

export function useApplications(volunteerId?: string) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!volunteerId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "applications"),
      where("volunteerId", "==", volunteerId)
    );

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
            } as Application;
          });
          
          // 手動排序（最新優先）
          data.sort((a, b) => {
            if (!a.createdAt || !b.createdAt) return 0;
            return b.createdAt.getTime() - a.createdAt.getTime();
          });
          
          setApplications(data);
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error("Error processing applications data:", err);
          setError(err as Error);
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error fetching applications:", err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [volunteerId]);

  return { applications, loading, error };
}


