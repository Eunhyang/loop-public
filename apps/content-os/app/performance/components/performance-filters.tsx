"use client";

import { PerformanceFilters, DiagnosisStatus, ContentType } from "@/types/performance";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STATUS_BADGE_CONFIG } from "../data/dummy-performance";

interface PerformanceFiltersProps {
  filters: PerformanceFilters;
  onFiltersChange: (filters: PerformanceFilters) => void;
}

const periodOptions: { value: PerformanceFilters["period"]; label: string }[] =
  [
    { value: "all", label: "전체 기간" },
    { value: "7d", label: "최근 7일" },
    { value: "14d", label: "최근 14일" },
    { value: "30d", label: "최근 30일" },
  ];

const statusOptions: {
  value: DiagnosisStatus | "all";
  label: string;
}[] = [
  { value: "all", label: "전체 상태" },
  ...Object.entries(STATUS_BADGE_CONFIG).map(([key, config]) => ({
    value: key as DiagnosisStatus,
    label: config.label,
  })),
];

const contentTypeOptions: { value: ContentType; label: string }[] = [
  { value: "all", label: "전체 형식" },
  { value: "shorts", label: "쇼츠" },
  { value: "long", label: "롱폼" },
];

export function PerformanceFiltersComponent({
  filters,
  onFiltersChange,
}: PerformanceFiltersProps) {
  const hasActiveFilters =
    filters.search || filters.period !== "all" || filters.status !== "all" || filters.contentType !== "all";

  const handleClearFilters = () => {
    onFiltersChange({
      search: "",
      period: "all",
      status: "all",
      contentType: "all",
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-[300px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="콘텐츠 검색..."
          value={filters.search}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
          className="pl-9"
        />
      </div>

      {/* Status Filter */}
      <Select
        value={filters.status}
        onValueChange={(value: DiagnosisStatus | "all") =>
          onFiltersChange({ ...filters, status: value })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="상태" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Content Type Filter */}
      <Select
        value={filters.contentType}
        onValueChange={(value: ContentType) =>
          onFiltersChange({ ...filters, contentType: value })
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="형식" />
        </SelectTrigger>
        <SelectContent>
          {contentTypeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Period Filter */}
      <Select
        value={filters.period}
        onValueChange={(value: PerformanceFilters["period"]) =>
          onFiltersChange({ ...filters, period: value })
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="기간" />
        </SelectTrigger>
        <SelectContent>
          {periodOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="text-muted-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          초기화
        </Button>
      )}
    </div>
  );
}
