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
    { href: "/admin", label: "儀表板", icon: "📊" },
    { href: "/admin/requests", label: "委托管理", icon: "📋" },
    { href: "/admin/volunteers", label: "義工管理", icon: "👥" },
    { href: "/admin/applications", label: "報名管理", icon: "📝" },
    { href: "/admin/logs", label: "操作日誌", icon: "📜" },
    { href: "/admin/export", label: "數據匯出", icon: "📤" },
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
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/60 hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <span>{item.icon}</span>
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

