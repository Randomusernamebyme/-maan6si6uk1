"use client";

import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { LoadingPage } from "@/components/ui/loading";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading } = useRequireAuth();

  if (loading) {
    return <LoadingPage />;
  }

  return <>{children}</>;
}


