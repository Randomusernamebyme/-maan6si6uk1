"use client";

import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { LoadingPage } from "@/components/ui/loading";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function VolunteerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useRequireAuth("volunteer");
  const pathname = usePathname();

  if (loading) {
    return <LoadingPage />;
  }

  const navItems = [
    { href: "/volunteer", label: "委托列表" },
    { href: "/volunteer/applications", label: "我的報名" },
    { href: "/volunteer/profile", label: "個人資料" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">義工儀表板</h1>
        {user && (
          <p className="text-muted-foreground mt-2">
            歡迎回來，{user.displayName}！
          </p>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* 側邊欄導航 */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
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

