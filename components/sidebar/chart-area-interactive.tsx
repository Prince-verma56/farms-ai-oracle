"use client";

import * as React from "react";
import { Dot } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDateShort } from "@/lib/time-anchor";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type OracleChartPoint = {
  date: string;
  historicalPrice?: number;
  forecastPrice?: number;
};

type ChartAreaInteractiveProps = {
  data: OracleChartPoint[];
  anchorDate: string;
};

const chartConfig: ChartConfig = {
  historicalPrice: {
    label: "Historical Mandi (₹/quintal)",
    color: "oklch(0.72 0.2 150)",
  },
  forecastPrice: {
    label: "AI Forecast (₹/quintal)",
    color: "oklch(0.7 0.2 240)",
  },
};

export function ChartAreaInteractive({ data, anchorDate }: ChartAreaInteractiveProps) {
  const isMobile = useIsMobile();
  const [range, setRange] = React.useState("30d");

  React.useEffect(() => {
    if (isMobile) setRange("7d");
  }, [isMobile]);

  const filteredData = React.useMemo(() => {
    const anchor = new Date(`${anchorDate}T00:00:00.000Z`);
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const start = new Date(anchor);
    const end = new Date(anchor);
    start.setUTCDate(start.getUTCDate() - (days - 1));
    end.setUTCDate(end.getUTCDate() + 14);

    return data.filter((item) => {
      const itemDate = new Date(`${item.date}T00:00:00.000Z`);
      return itemDate >= start && itemDate <= end;
    });
  }, [anchorDate, data, range]);

  return (
    <Card className="bg-card/50 backdrop-blur-md border border-primary/10 hover:border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.05)] transition-all">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Mandi Trend vs Oracle Forecast
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-500">
            <Dot className="size-4 animate-pulse" />
            Live
          </span>
        </CardTitle>
        <CardDescription>
          Historical mandi modal price to the anchor date and AI forecast from the next day onward.
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={range}
            onValueChange={(value) => value && setRange(value)}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 90 days</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-36 @[767px]/card:hidden" size="sm" aria-label="Select time range">
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 90 days
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillHistoricalPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-historicalPrice)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-historicalPrice)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="fillForecastPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-forecastPrice)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-forecastPrice)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={28}
              tickFormatter={(value) => formatDateShort(String(value))}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent indicator="dot" labelFormatter={(value) => formatDateShort(String(value))} />
              }
            />
            <ReferenceLine x={anchorDate} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="historicalPrice"
              stroke="var(--color-historicalPrice)"
              fill="url(#fillHistoricalPrice)"
              strokeWidth={2}
              connectNulls={false}
            />
            <Area
              type="monotone"
              dataKey="forecastPrice"
              stroke="var(--color-forecastPrice)"
              fill="url(#fillForecastPrice)"
              strokeWidth={2.5}
              strokeDasharray="7 6"
              connectNulls={false}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
