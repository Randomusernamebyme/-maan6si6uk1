"use client";

import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Home } from "lucide-react";

export function Header() {
  const { user, logout, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("登出失敗:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">堅城萬事屋</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-4">
            <Link
              href="/"
              className="text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60"
            >
              <Home className="h-4 w-4 inline mr-1" />
              首頁
            </Link>
            {user && (
              <>
                {user.role === "volunteer" && (
                  <>
                    <Link
                      href="/volunteer"
                      className="text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60"
                    >
                      委托列表
                    </Link>
                    <Link
                      href="/volunteer/applications"
                      className="text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60"
                    >
                      我的報名
                    </Link>
                    <Link
                      href="/volunteer/profile"
                      className="text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60"
                    >
                      個人資料
                    </Link>
                  </>
                )}
                {user.role === "admin" && (
                  <>
                    <Link
                      href="/admin"
                      className="text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60"
                    >
                      管理後台
                    </Link>
                    <Link
                      href="/admin/requests"
                      className="text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60"
                    >
                      委托管理
                    </Link>
                    <Link
                      href="/admin/volunteers"
                      className="text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60"
                    >
                      義工管理
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user.displayName}</span>
                  <span className="hidden sm:inline text-muted-foreground">
                    ({user.role === "admin" ? "管理員" : "義工"})
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={user.role === "admin" ? "/admin" : "/volunteer/profile"} className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    個人資料
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  登出
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">登入</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">註冊</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

