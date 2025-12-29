"use client";

import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { LoadingPage } from "@/components/ui/loading";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useRequireAuth("admin");
  const pathname = usePathname();

  if (loading) {
    return <LoadingPage />;
  }

  const navItems = [
    { href: "/admin/dashboard", label: "儀表板" },
    { href: "/admin/requests", label: "委托管理" },
    { href: "/admin/volunteers", label: "義工管理" },
    { href: "/admin/applications", label: "報名管理" },
    { href: "/admin/logs", label: "操作日誌" },
    { href: "/admin/export", label: "數據匯出" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">管理後台</h1>
        {user && (
          <p className="text-muted-foreground mt-2">
            歡迎，{user.displayName}！
          </p>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* 側邊欄導航 */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/60 hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* 主要內容區域 */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

