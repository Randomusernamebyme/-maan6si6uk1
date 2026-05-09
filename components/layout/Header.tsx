"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { HEADER_BRANDING } from "@/lib/constants/branding";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Menu, User } from "lucide-react";

export function Header() {
  const { user, logout, loading } = useAuth();
  const dashboardHref = user?.role === "admin" ? "/admin/dashboard" : "/volunteer/dashboard";

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("登出失敗:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-[#86926d]">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Button asChild variant="ghost" className="text-xl font-bold p-0 h-auto hover:bg-transparent">
            <Link href="/" className="flex items-center space-x-2">
              {HEADER_BRANDING.logoUrl ? (
                // 略過 /_next/image 最佳化，避免 PNG 透明經 API 302 後被轉成白底
                <Image
                  src={HEADER_BRANDING.logoUrl}
                  alt={HEADER_BRANDING.title}
                  width={HEADER_BRANDING.width}
                  height={HEADER_BRANDING.height}
                  className="h-10 w-auto object-contain"
                  priority
                  unoptimized
                />
              ) : (
                HEADER_BRANDING.title
              )}
            </Link>
          </Button>
          
          <nav className="hidden md:flex items-center gap-4">
            {user && (
              <Link
                href={user.role === "admin" ? "/admin/dashboard" : "/volunteer/dashboard"}
                className="text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60"
              >
                看板
              </Link>
            )}
            <Link
              href="/gallery"
              className="text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60"
            >
              展覽
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="開啟導覽選單">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="md:hidden">
              {user && (
                <DropdownMenuItem asChild>
                  <Link href={dashboardHref}>看板</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href="/gallery">展覽</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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

