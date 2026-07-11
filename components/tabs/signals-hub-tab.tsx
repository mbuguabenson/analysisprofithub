"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, ShieldCheck, Activity, Layers } from "lucide-react"
import type { Signal, AnalysisResult } from "@/lib/analysis-engine"
import type { DerivSymbol } from "@/hooks/use-deriv"
import { SignalsTab } from "@/components/tabs/signals-tab"
import { ProSignalsTab } from "@/components/tabs/pro-signals-tab"
import { HeritageSuperSignals } from "@/components/heritage-super-signals"
import { AdvancedSignalsTab } from "@/components/advanced-signals-tab"

interface SignalsHubTabProps {
  signals: Signal[]
  proSignals: Signal[]
  analysis: AnalysisResult | null
  theme?: "light" | "dark"
  symbol: string
  availableSymbols?: DerivSymbol[]
  currentPrice?: number | null
  currentDigit?: number | null
  tickCount?: number
  maxTicks?: number
  onMaxTicksChange?: (ticks: number) => void
  onSymbolChange?: (symbol: string) => void
  recentDigits: number[]
}

export function SignalsHubTab({
  signals,
  proSignals,
  analysis,
  theme = "dark",
  symbol,
  availableSymbols = [],
  currentPrice,
  currentDigit,
  tickCount,
  maxTicks,
  onMaxTicksChange,
  onSymbolChange,
  recentDigits,
}: SignalsHubTabProps) {
  const [activeSection, setActiveSection] = useState<string>("standard")

  const activeSignals = signals.filter((signal) => signal.status !== "NEUTRAL")
  const tradeNowCount = activeSignals.filter((signal) => signal.status === "TRADE NOW").length
  const proSignalCount = proSignals.length
  const availableMarketCount = availableSymbols.length
  const advancedScanCount = analysis ? analysis.digitFrequencies?.length ?? 0 : 0

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-4">
        <Card className={`p-4 rounded-3xl border ${theme === "dark" ? "bg-slate-950/80 border-white/10" : "bg-white border-slate-200"}`}>
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] font-black text-slate-400">Standard Signals</p>
              <p className="text-2xl font-black text-white">{activeSignals.length}</p>
            </div>
          </div>
          <p className="text-sm text-slate-400">Active market signals across standard and premium feeds.</p>
        </Card>

        <Card className={`p-4 rounded-3xl border ${theme === "dark" ? "bg-slate-950/80 border-white/10" : "bg-white border-slate-200"}`}>
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] font-black text-slate-400">Pro Signals</p>
              <p className="text-2xl font-black text-white">{proSignalCount}</p>
            </div>
          </div>
          <p className="text-sm text-slate-400">Premium trade ideas optimized for high-probability setups.</p>
        </Card>

        <Card className={`p-4 rounded-3xl border ${theme === "dark" ? "bg-slate-950/80 border-white/10" : "bg-white border-slate-200"}`}>
          <div className="flex items-center gap-3 mb-3">
            <Activity className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] font-black text-slate-400">Super Signals</p>
              <p className="text-2xl font-black text-white">{availableMarketCount}</p>
            </div>
          </div>
          <p className="text-sm text-slate-400">Live market scan coverage for synthetic, derived, and high-volatility assets.</p>
        </Card>

        <Card className={`p-4 rounded-3xl border ${theme === "dark" ? "bg-slate-950/80 border-white/10" : "bg-white border-slate-200"}`}>
          <div className="flex items-center gap-3 mb-3">
            <Layers className="w-5 h-5 text-violet-400" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] font-black text-slate-400">Advanced Scan</p>
              <p className="text-2xl font-black text-white">{advancedScanCount}</p>
            </div>
          </div>
          <p className="text-sm text-slate-400">Deep market analytics and AI-driven pattern discovery.</p>
        </Card>
      </div>

      <Card className={`rounded-3xl border ${theme === "dark" ? "bg-slate-950/90 border-white/10" : "bg-white border-slate-200"}`}>
        <div className="flex flex-col gap-3 p-4 border-b border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-white">Signals Hub</h2>
            <p className="text-sm text-slate-400">One place for standard, pro, super and advanced signal feeds.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-cyan-500/15 text-cyan-200 border border-cyan-500/20">{tradeNowCount} Trade Now</Badge>
            <Badge className="rounded-full bg-slate-800/80 text-slate-200 border border-white/10">{availableMarketCount} Markets</Badge>
          </div>
        </div>

        <div className="p-4">
          <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-4">
            <TabsList className="grid grid-cols-4 gap-2 rounded-2xl border border-white/10 bg-slate-900/80 p-1">
              <TabsTrigger value="standard" className="text-[11px] font-bold uppercase">Standard</TabsTrigger>
              <TabsTrigger value="pro" className="text-[11px] font-bold uppercase">Pro</TabsTrigger>
              <TabsTrigger value="super" className="text-[11px] font-bold uppercase">Super</TabsTrigger>
              <TabsTrigger value="advanced" className="text-[11px] font-bold uppercase">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="standard" className="mt-4">
              <SignalsTab
                signals={signals}
                proSignals={proSignals}
                analysis={analysis}
                theme={theme}
                symbol={symbol}
                availableSymbols={availableSymbols}
                currentPrice={currentPrice}
                currentDigit={currentDigit}
                tickCount={tickCount}
                maxTicks={maxTicks}
                onMaxTicksChange={onMaxTicksChange}
              />
            </TabsContent>

            <TabsContent value="pro" className="mt-4">
              <ProSignalsTab
                proSignals={proSignals}
                analysis={analysis}
                theme={theme}
                symbol={symbol}
                availableSymbols={availableSymbols}
                currentPrice={currentPrice}
                currentDigit={currentDigit}
                tickCount={tickCount}
                onSymbolChange={onSymbolChange}
              />
            </TabsContent>

            <TabsContent value="super" className="mt-4">
              <HeritageSuperSignals
                theme={theme}
                symbol={symbol}
                availableSymbols={availableSymbols}
                maxTicks={maxTicks}
                analysis={analysis}
                recentDigits={recentDigits}
                tickCount={tickCount}
              />
            </TabsContent>

            <TabsContent value="advanced" className="mt-4">
              <AdvancedSignalsTab theme={theme} availableSymbols={availableSymbols} />
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  )
}
