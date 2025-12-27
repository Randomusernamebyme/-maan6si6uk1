"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
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
      where("volunteerId", "==", volunteerId),
      orderBy("createdAt", "desc")
    );

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
          } as Application;
        });
        setApplications(data);
        setLoading(false);
        setError(null);
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

