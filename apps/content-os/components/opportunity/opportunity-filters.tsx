"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  OpportunityFilters,
  PurposeType,
  TargetLoop,
  Format,
  Period,
  PURPOSE_TYPE_LABELS,
  TARGET_LOOP_LABELS,
  FORMAT_LABELS,
  PERIOD_LABELS,
  PurposeTypeFilter,
  TargetLoopFilter,
  FormatFilter,
  PeriodFilter,
} from "@/lib/types/opportunity";

interface OpportunityFiltersProps {
  filters: OpportunityFilters;
  onFilterChange: (filters: OpportunityFilters) => void;
}

export function OpportunityFiltersComponent({
  filters,
  onFilterChange,
}: OpportunityFiltersProps) {
  const handlePurposeTypeChange = (value: string) => {
    onFilterChange({
      ...filters,
      purposeType: value as PurposeTypeFilter,
    });
  };

  const handleTargetLoopChange = (value: string) => {
    onFilterChange({
      ...filters,
      targetLoop: value as TargetLoopFilter,
    });
  };

  const handleFormatChange = (value: string) => {
    onFilterChange({
      ...filters,
      format: value as FormatFilter,
    });
  };

  const handlePeriodChange = (value: string) => {
    onFilterChange({
      ...filters,
      period: value as PeriodFilter,
    });
  };

  return (
    <div className="flex flex-wrap gap-3 p-4 bg-muted/30 rounded-lg">
      {/* Purpose Type Filter */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-muted-foreground">목적 타입</label>
        <Select
          value={filters.purposeType}
          onValueChange={handlePurposeTypeChange}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            {(Object.keys(PURPOSE_TYPE_LABELS) as PurposeType[]).map((key) => (
              <SelectItem key={key} value={key}>
                {PURPOSE_TYPE_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Target Loop Filter */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-muted-foreground">타겟 루프</label>
        <Select
          value={filters.targetLoop}
          onValueChange={handleTargetLoopChange}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            {(Object.keys(TARGET_LOOP_LABELS) as TargetLoop[]).map((key) => (
              <SelectItem key={key} value={key}>
                {TARGET_LOOP_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Format Filter */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-muted-foreground">포맷</label>
        <Select
          value={filters.format}
          onValueChange={handleFormatChange}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            {(Object.keys(FORMAT_LABELS) as Format[]).map((key) => (
              <SelectItem key={key} value={key}>
                {FORMAT_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Period Filter */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-muted-foreground">기간</label>
        <Select
          value={filters.period}
          onValueChange={handlePeriodChange}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            {(Object.keys(PERIOD_LABELS) as Period[]).map((key) => (
              <SelectItem key={key} value={key}>
                {PERIOD_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
