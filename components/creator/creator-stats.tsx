"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

interface CreatorStats {
  totalSales: number
  totalRevenue: number
  conversionRate: number
  totalPlays: number
  dailyStats: Array<{
    date: string
    downloads: number
    plays: number
    revenue: number
  }>
}

interface CreatorStatsProps {
  dateRange: string
}

const defaultStats: CreatorStats = {
  totalSales: 0,
  totalRevenue: 0,
  conversionRate: 0,
  totalPlays: 0,
  dailyStats: []
}

export function CreatorStats({ dateRange }: CreatorStatsProps) {
  const [stats, setStats] = useState<CreatorStats>(defaultStats)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch(`/api/creator/stats?range=${dateRange}`)
        if (!response.ok) throw new Error("Failed to fetch stats")
        const data = await response.json()
        // Ensure all required properties exist with default values
        setStats({
          totalSales: data.totalSales ?? 0,
          totalRevenue: data.totalRevenue ?? 0,
          conversionRate: data.conversionRate ?? 0,
          totalPlays: data.totalPlays ?? 0,
          dailyStats: Array.isArray(data.dailyStats) ? data.dailyStats : []
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
        setStats(defaultStats)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [dateRange])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-16 animate-pulse bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="h-[300px] animate-pulse bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground mb-1">Downloads</div>
            <div className="text-2xl font-bold">{stats.totalSales?.toLocaleString() ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground mb-1">Plays</div>
            <div className="text-2xl font-bold">{stats.totalPlays?.toLocaleString() ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground mb-1">Conversion rate</div>
            <div className="text-2xl font-bold">{stats.conversionRate?.toFixed(2) ?? "0.00"}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground mb-1">Revenue</div>
            <div className="text-2xl font-bold">${stats.totalRevenue?.toFixed(2) ?? "0.00"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Graph */}
      <Card>
        <CardContent className="pt-6">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.dailyStats}>
                <XAxis 
                  dataKey="date" 
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="downloads"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 