"use client"

import React from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface AnalyticsChartProps {
  data: Array<{
    ts: string
    profit: number
    stake: number
  }>
}

export function AnalyticsChart({ data }: AnalyticsChartProps) {
  const chartData = data.map((item, idx) => ({
    name: `Trade ${idx + 1}`,
    profit: item.profit,
    stake: item.stake,
    cumulative: (data.slice(0, idx + 1).reduce((sum, d) => sum + d.profit, 0))
  }))

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <h2 className="text-lg font-bold text-white mb-6">Profit & Loss Trend</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="name"
            stroke="rgba(255,255,255,0.3)"
            style={{ fontSize: "12px" }}
            tick={{ fill: "rgba(255,255,255,0.5)" }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.3)"
            style={{ fontSize: "12px" }}
            tick={{ fill: "rgba(255,255,255,0.5)" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0a0a0a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              padding: "8px"
            }}
            labelStyle={{ color: "#fff" }}
            formatter={(value: any) => `$${value.toFixed(2)}`}
          />
          <Line
            type="monotone"
            dataKey="cumulative"
            stroke="#06b6d4"
            strokeWidth={2}
            dot={{ fill: "#06b6d4", r: 3 }}
            activeDot={{ r: 5 }}
            name="Cumulative P&L"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
