"use client";

import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Header() {
  const { user, logout, loading } = useAuth();
  const { unreadCount } = useNotifications({ read: false });

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
          <Button asChild variant="ghost" className="text-xl font-bold p-0 h-auto hover:bg-transparent">
            <Link href="/" className="flex items-center space-x-2">
              堅城萬事屋
            </Link>
          </Button>
          
          {user && (
            <nav className="hidden md:flex items-center gap-4">
              <Link
                href={user.role === "admin" ? "/admin/dashboard" : "/volunteer/dashboard"}
                className="text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60"
              >
                看板
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <>
              {user.role === "volunteer" && (
                <Button asChild variant="ghost" size="icon" className="relative">
                  <Link href="/volunteer/notifications">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Badge>
                    )}
                  </Link>
                </Button>
              )}
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
                  <Link href={user.role === "admin" ? "/admin/dashboard" : "/volunteer/profile"} className="flex items-center">
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
            </>
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

