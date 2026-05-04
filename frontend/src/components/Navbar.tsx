"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, LayoutDashboard, PlusCircle, LogIn, LogOut, Home, Search, ReceiptText, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/search", label: "Buscar", icon: Search },
  { href: "/publish", label: "Publicar", icon: PlusCircle },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/billing", label: "Facturas", icon: ReceiptText },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed inset-x-0 top-0 z-40"
    >
      <div className="mx-auto mt-4 max-w-6xl px-4">
        <div className="glass-strong flex items-center justify-between rounded-2xl px-4 py-2.5 shadow-soft">
          <Link href="/" className="flex items-center gap-2 pl-1 pr-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[hsl(var(--brand))] blur-md opacity-60" />
              <Sparkles className="relative h-5 w-5 text-[hsl(var(--brand))]" />
            </div>
            <span className="font-semibold tracking-tight">
              Arvia<span className="text-[hsl(var(--brand))]">.ai</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => {
              const active =
                l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "relative rounded-full px-4 py-2 text-sm transition-colors",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-white/10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    <l.icon className="h-3.5 w-3.5" />
                    {l.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-xl">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] border-white/10 bg-black/90 backdrop-blur-xl">
                  <SheetHeader className="text-left mb-8">
                    <SheetTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-indigo-500" />
                      Arvia.ai
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-2">
                    {links.map((l) => (
                      <Link key={l.href} href={l.href}>
                        <Button
                          variant={pathname === l.href ? "secondary" : "ghost"}
                          className="w-full justify-start gap-3 h-12 rounded-xl"
                        >
                          <l.icon size={18} />
                          {l.label}
                        </Button>
                      </Link>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm hover:bg-white/10 transition">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(var(--brand))] to-cyan-500 text-[10px] font-semibold text-white">
                      {(user.displayName ?? user.email ?? "U").slice(0, 1).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline text-foreground/90 max-w-[120px] truncate">
                      {user.displayName ?? user.email}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>{user.email ?? "Sesión activa"}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/publish")}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Publicar propiedad
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <button
                    onClick={() => {
                      logout();
                      router.push("/");
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-white/5 transition"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
                  </button>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => router.push("/login")}
                className="gap-2"
              >
                <LogIn className="h-3.5 w-3.5" />
                Iniciar sesión
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
