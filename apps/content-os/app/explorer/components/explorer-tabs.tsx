"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Bookmark, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

export type ExplorerTab = "explore" | "collection" | "blocked";

interface ExplorerTabsProps {
  activeTab: ExplorerTab;
  onTabChange: (tab: ExplorerTab) => void;
  collectionCount: number;
  blockedCount: number;
  children: React.ReactNode;
}

/**
 * Tab navigation for Explorer page
 */
export function ExplorerTabs({
  activeTab,
  onTabChange,
  collectionCount,
  blockedCount,
  children,
}: ExplorerTabsProps) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value: string) => onTabChange(value as ExplorerTab)}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-3 max-w-md">
        <TabsTrigger value="explore" className="gap-2">
          <Search className="h-4 w-4" />
          <span>Explore</span>
        </TabsTrigger>
        <TabsTrigger value="collection" className="gap-2">
          <Bookmark className="h-4 w-4" />
          <span>Collection</span>
          {collectionCount > 0 && (
            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {collectionCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="blocked" className="gap-2">
          <Ban className="h-4 w-4" />
          <span>Blocked</span>
          {blockedCount > 0 && (
            <span className="ml-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
              {blockedCount}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      {children}
    </Tabs>
  );
}

/**
 * Individual tab content wrapper
 */
export function ExplorerTabContent({
  value,
  children,
  className,
}: {
  value: ExplorerTab;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <TabsContent value={value} className={cn("mt-4", className)}>
      {children}
    </TabsContent>
  );
}
