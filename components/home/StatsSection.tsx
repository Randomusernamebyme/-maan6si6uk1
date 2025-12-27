"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export function StatsSection() {
  const [stats, setStats] = useState({
    completedRequests: 0,
    activeVolunteers: 0,
    totalApplications: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 獲取已完成的委托數
        const completedRequestsQuery = query(
          collection(db, "requests"),
          where("status", "==", "completed")
        );
        const completedRequestsSnapshot = await getDocs(completedRequestsQuery);

        // 獲取已批准的義工數
        const approvedVolunteersQuery = query(
          collection(db, "users"),
          where("role", "==", "volunteer"),
          where("status", "==", "approved")
        );
        const approvedVolunteersSnapshot = await getDocs(approvedVolunteersQuery);

        // 獲取總報名數
        const applicationsSnapshot = await getDocs(collection(db, "applications"));

        setStats({
          completedRequests: completedRequestsSnapshot.size,
          activeVolunteers: approvedVolunteersSnapshot.size,
          totalApplications: applicationsSnapshot.size,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statsData = [
    {
      label: "已完成委托",
      value: stats.completedRequests,
      suffix: "個",
    },
    {
      label: "活躍義工",
      value: stats.activeVolunteers,
      suffix: "位",
    },
    {
      label: "總報名數",
      value: stats.totalApplications,
      suffix: "次",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">我們的成果</h2>
          <p className="text-lg text-muted-foreground">
            感謝每一位義工和委托者的支持，讓我們一起為社區創造更多溫暖
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
          {statsData.map((stat, index) => (
            <div key={index} className="text-center">
              {loading ? (
                <div className="text-4xl font-bold text-muted-foreground animate-pulse">
                  --
                </div>
              ) : (
                <div className="text-5xl md:text-6xl font-bold mb-2">
                  {stat.value}
                  <span className="text-2xl md:text-3xl text-muted-foreground ml-2">
                    {stat.suffix}
                  </span>
                </div>
              )}
              <p className="text-lg text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

