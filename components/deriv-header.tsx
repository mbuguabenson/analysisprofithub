"use client"

import React from "react"

export interface DerivTab {
  id: string
  name: string
  url: string
}

export const tabs: DerivTab[] = [
  { id: "dbot", name: "DBot", url: "https://app.deriv.com/bot" },
  { id: "smarttrader", name: "SmartTrader", url: "https://smarttrader.deriv.com" },
]

interface DerivHeaderProps {
  activeTab: DerivTab
  setActiveTab: (tab: DerivTab) => void
  theme?: "light" | "dark"
}

export function DerivHeader({ activeTab, setActiveTab, theme = "dark" }: DerivHeaderProps) {
  const isDark = theme === "dark"

  return (
    <div
      className={`flex items-center gap-1 px-2 py-1.5 border-b ${
        isDark ? "bg-gray-900 border-white/10" : "bg-white border-gray-200"
      }`}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab)}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
            activeTab.id === tab.id
              ? "bg-blue-600 text-white shadow"
              : isDark
              ? "text-white/50 hover:text-white hover:bg-white/10"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          {tab.name}
        </button>
      ))}
    </div>
  )
}
