"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, Plus, DollarSign, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Accueil" },
  { href: "/devis", icon: FileText, label: "Devis" },
  { href: "#fab", icon: Plus, label: "", isFab: true },
  { href: "/devis/nouveau", icon: MessageCircle, label: "Nouveau" },
  { href: "/finances", icon: DollarSign, label: "Finances" },
];

export function BottomBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#080C18]/90 backdrop-blur-xl">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          if (item.isFab) {
            return (
              <Link key="fab" href="/devis/nouveau" className="flex items-center justify-center -mt-6 h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-colors">
                <Plus className="h-6 w-6" />
              </Link>
            );
          }
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 text-xs transition-colors",
                isActive ? "text-blue-400" : "text-muted-foreground hover:text-white/70"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
