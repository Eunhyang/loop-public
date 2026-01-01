"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Lightbulb,
  Search,
  GitBranch,
  BarChart3,
  RotateCcw,
  Moon,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    href: "/opportunity",
    label: "Opportunity",
    icon: <Lightbulb className="h-5 w-5" />,
  },
  {
    href: "/explorer",
    label: "Explorer",
    icon: <Search className="h-5 w-5" />,
  },
  {
    href: "/pipeline",
    label: "Pipeline",
    icon: <GitBranch className="h-5 w-5" />,
  },
  {
    href: "/performance",
    label: "Performance",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    href: "/retro",
    label: "Retro",
    icon: <RotateCcw className="h-5 w-5" />,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-sidebar">
      {/* Logo / Brand */}
      <div className="flex h-16 items-center px-6">
        <h1 className="text-xl font-bold text-sidebar-foreground">Content OS</h1>
      </div>

      <Separator />

      {/* Navigation */}
      <nav aria-label="Primary navigation" className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Theme Toggle */}
      <div className="p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full justify-start gap-3"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="dark:hidden">Light Mode</span>
          <span className="hidden dark:inline">Dark Mode</span>
        </Button>
      </div>
    </aside>
  );
}
