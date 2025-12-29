"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import Link from "next/link";
import { RequestStatus, UserStatus } from "@/types";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    pendingRequests: 0,
    pendingVolunteers: 0,
    inProgressRequests: 0,
    totalVolunteers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 待審核委托數
        const pendingRequestsQuery = query(
          collection(db, "requests"),
          where("status", "==", "pending")
        );
        const pendingRequestsSnapshot = await getDocs(pendingRequestsQuery);

        // 待審核義工數
        const pendingVolunteersQuery = query(
          collection(db, "users"),
          where("role", "==", "volunteer"),
          where("status", "==", "pending")
        );
        const pendingVolunteersSnapshot = await getDocs(pendingVolunteersQuery);

        // 進行中委托數
        const inProgressRequestsQuery = query(
          collection(db, "requests"),
          where("status", "==", "matched")
        );
        const inProgressRequestsSnapshot = await getDocs(inProgressRequestsQuery);

        // 總義工人數
        const totalVolunteersQuery = query(
          collection(db, "users"),
          where("role", "==", "volunteer")
        );
        const totalVolunteersSnapshot = await getDocs(totalVolunteersQuery);

        setStats({
          pendingRequests: pendingRequestsSnapshot.size,
          pendingVolunteers: pendingVolunteersSnapshot.size,
          inProgressRequests: inProgressRequestsSnapshot.size,
          totalVolunteers: totalVolunteersSnapshot.size,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">統計概覽</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>待審核委托</CardDescription>
              <CardTitle className="text-3xl">{stats.pendingRequests}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>待審核義工</CardDescription>
              <CardTitle className="text-3xl">{stats.pendingVolunteers}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>進行中委托</CardDescription>
              <CardTitle className="text-3xl">{stats.inProgressRequests}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>總義工人數</CardDescription>
              <CardTitle className="text-3xl">{stats.totalVolunteers}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">快捷操作</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <Link href="/admin/requests?status=pending">
              <CardHeader>
                <CardTitle>查看待審核委托</CardTitle>
                <CardDescription>
                  目前有 {stats.pendingRequests} 個委托待審核
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <Link href="/admin/volunteers?status=pending">
              <CardHeader>
                <CardTitle>查看待審核義工</CardTitle>
                <CardDescription>
                  目前有 {stats.pendingVolunteers} 位義工待審核
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <Link href="/admin/applications">
              <CardHeader>
                <CardTitle>查看最新報名</CardTitle>
                <CardDescription>查看所有義工的報名記錄</CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}

