"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProblemType } from "@/types/performance";
import { PROBLEM_TYPE_LABELS } from "../../data/dummy-performance";

interface ProblemTypeChartProps {
  breakdown: Record<ProblemType, number>;
  className?: string;
}

const COLORS = {
  thumbnail_title: "#f59e0b", // amber
  early_hook: "#f97316", // orange
  topic_timing: "#ef4444", // red
  none: "#22c55e", // green
};

export function ProblemTypeChart({
  breakdown,
  className,
}: ProblemTypeChartProps) {
  const data = Object.entries(breakdown)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => ({
      name: PROBLEM_TYPE_LABELS[type as ProblemType],
      value: count,
      type: type as ProblemType,
    }));

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium">문제 유형 분석</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground">
          분석할 데이터가 없습니다
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium">문제 유형 분석</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Pie Chart */}
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry) => (
                  <Cell
                    key={`cell-${entry.type}`}
                    fill={COLORS[entry.type]}
                    strokeWidth={0}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value) => [typeof value === 'number' ? `${value}개` : value, "콘텐츠"]}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Bar Chart */}
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                type="number"
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
              />
              <YAxis
                dataKey="name"
                type="category"
                width={80}
                tick={{ fontSize: 10 }}
                className="fill-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value) => [typeof value === 'number' ? `${value}개` : value, "콘텐츠"]}
              />
              <Bar
                dataKey="value"
                radius={[0, 4, 4, 0]}
              >
                {data.map((entry) => (
                  <Cell
                    key={`bar-${entry.type}`}
                    fill={COLORS[entry.type]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
