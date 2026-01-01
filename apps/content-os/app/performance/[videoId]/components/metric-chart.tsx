"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContentMetrics } from "@/types/performance";

interface MetricChartProps {
  metrics: ContentMetrics;
  className?: string;
}

export function MetricChart({ metrics, className }: MetricChartProps) {
  const data = [
    {
      name: "노출수",
      "24시간": metrics.impressions_24h,
      "7일": metrics.impressions_7d,
    },
    {
      name: "조회수",
      "24시간": metrics.views_24h,
      "7일": metrics.views_7d,
    },
  ];

  const ctrData = [
    {
      name: "CTR",
      "24시간": metrics.ctr_24h,
      "7일": metrics.ctr_7d,
    },
  ];

  const durationData = [
    {
      name: "평균 시청 시간",
      "24시간": Math.round(metrics.avg_view_duration_24h / 60 * 10) / 10,
      "7일": Math.round(metrics.avg_view_duration_7d / 60 * 10) / 10,
    },
  ];

  return (
    <div className={className}>
      <div className="grid gap-4 md:grid-cols-2">
        {/* Volume Metrics Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              노출/조회 비교
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                  tickFormatter={(value) =>
                    value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => typeof value === 'number' ? value.toLocaleString() : value}
                />
                <Legend />
                <Bar
                  dataKey="24시간"
                  fill="hsl(var(--chart-1))"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="7일"
                  fill="hsl(var(--chart-2))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* CTR Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">CTR 비교</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ctrData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  type="number"
                  domain={[0, 12]}
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => typeof value === 'number' ? `${value.toFixed(1)}%` : value}
                />
                <Legend />
                <Bar
                  dataKey="24시간"
                  fill="hsl(var(--chart-1))"
                  radius={[0, 4, 4, 0]}
                />
                <Bar
                  dataKey="7일"
                  fill="hsl(var(--chart-2))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Average View Duration Chart */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              평균 시청 시간 (분)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={durationData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                  tickFormatter={(value) => `${value}분`}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => typeof value === 'number' ? `${value.toFixed(1)}분` : value}
                />
                <Legend />
                <Bar
                  dataKey="24시간"
                  fill="hsl(var(--chart-1))"
                  radius={[0, 4, 4, 0]}
                />
                <Bar
                  dataKey="7일"
                  fill="hsl(var(--chart-2))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
