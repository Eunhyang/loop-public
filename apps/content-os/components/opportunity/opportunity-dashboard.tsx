"use client";

import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { OpportunityFiltersComponent } from "./opportunity-filters";
import { OpportunityGrid } from "./opportunity-grid";
import { useOpportunities } from "@/lib/api/hooks/useOpportunities";
import { LoadingSpinner } from "@/components/firebase/loading-spinner";
import { ErrorMessage } from "@/components/firebase/error-message";
import { Opportunity, OpportunityFilters, Period } from "@/lib/types/opportunity";

// Helper function to check if a date is within the period
function isWithinPeriod(dateStr: string, period: Period): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const daysAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  switch (period) {
    case "7d":
      return daysAgo <= 7;
    case "14d":
      return daysAgo <= 14;
    case "30d":
      return daysAgo <= 30;
    default:
      return true;
  }
}

export function OpportunityDashboard() {
  // Fetch opportunities from Firebase
  const { data: firebaseOpportunities, isLoading, error, refetch } = useOpportunities();

  // Filter state
  const [filters, setFilters] = useState<OpportunityFilters>({
    purposeType: "all",
    targetLoop: "all",
    format: "all",
    period: "all",
  });

  // Opportunity state for favorites and exclusions (client-side state)
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  // Sync Firebase data to local state when it changes
  // Merge with existing local state to preserve isFavorite/isExcluded flags
  useEffect(() => {
    if (firebaseOpportunities) {
      setOpportunities((prevOpportunities) => {
        // If no previous state, just use Firebase data
        if (prevOpportunities.length === 0) {
          return firebaseOpportunities;
        }

        // Merge: preserve local flags for existing items
        const prevById = new Map(prevOpportunities.map((opp) => [opp.id, opp]));

        return firebaseOpportunities.map((fbOpp: Opportunity) => {
          const prevOpp = prevById.get(fbOpp.id);
          if (prevOpp) {
            // Preserve local-only flags
            return {
              ...fbOpp,
              isFavorite: prevOpp.isFavorite,
              isExcluded: prevOpp.isExcluded,
            };
          }
          return fbOpp;
        });
      });
    }
  }, [firebaseOpportunities]);

  // Loading state
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Error state
  if (error) {
    return <ErrorMessage error={error as Error} onRetry={() => refetch()} />;
  }

  // Filter and sort opportunities
  const filteredOpportunities = useMemo(() => {
    return opportunities
      .filter((opp) => {
        // Exclude hidden items
        if (opp.isExcluded) return false;

        // Purpose type filter
        if (filters.purposeType !== "all" && opp.purposeType !== filters.purposeType) {
          return false;
        }

        // Target loop filter
        if (filters.targetLoop !== "all" && opp.targetLoop !== filters.targetLoop) {
          return false;
        }

        // Format filter
        if (filters.format !== "all" && opp.format !== filters.format) {
          return false;
        }

        // Period filter
        if (filters.period !== "all" && !isWithinPeriod(opp.createdAt, filters.period)) {
          return false;
        }

        return true;
      })
      // Sort: favorites first, then by finalScore descending
      .sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return b.finalScore - a.finalScore;
      });
  }, [opportunities, filters]);

  // Handler: Create draft
  const handleCreateDraft = (id: string) => {
    const opp = opportunities.find((o) => o.id === id);
    if (opp) {
      toast.success(`Draft 태스크가 생성되었습니다`, {
        description: `"${opp.keyword}" 키워드로 Draft가 생성되었습니다.`,
      });
    }
  };

  // Handler: Exclude opportunity
  const handleExclude = (id: string) => {
    setOpportunities((prev) =>
      prev.map((opp) =>
        opp.id === id ? { ...opp, isExcluded: true } : opp
      )
    );
    toast.info("목록에서 제외되었습니다", {
      description: "제외된 항목은 다시 표시되지 않습니다.",
    });
  };

  // Handler: Toggle favorite
  // Fixed: Derive toast message from the updated state to avoid stale state issues
  const handleToggleFavorite = (id: string) => {
    setOpportunities((prev) => {
      const updated = prev.map((opp) =>
        opp.id === id ? { ...opp, isFavorite: !opp.isFavorite } : opp
      );

      // Find the updated opportunity to show correct toast
      const updatedOpp = updated.find((o) => o.id === id);
      if (updatedOpp) {
        if (updatedOpp.isFavorite) {
          toast.success("즐겨찾기에 추가되었습니다", {
            description: "즐겨찾기 항목은 상단에 표시됩니다.",
          });
        } else {
          toast.info("즐겨찾기에서 제거되었습니다");
        }
      }

      return updated;
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Stats Bar */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          총 <strong className="text-foreground">{filteredOpportunities.length}</strong>개의 Opportunity
        </span>
        <span>|</span>
        <span>
          즐겨찾기 <strong className="text-foreground">{filteredOpportunities.filter((o) => o.isFavorite).length}</strong>개
        </span>
      </div>

      {/* Filters */}
      <OpportunityFiltersComponent
        filters={filters}
        onFilterChange={setFilters}
      />

      {/* Grid */}
      <OpportunityGrid
        opportunities={filteredOpportunities}
        onCreateDraft={handleCreateDraft}
        onExclude={handleExclude}
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  );
}
