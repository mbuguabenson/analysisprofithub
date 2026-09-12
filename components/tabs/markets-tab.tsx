"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Check, CheckSquare, Minus, Square, Zap } from "lucide-react"
import { DerivWebSocketManager } from "@/lib/deriv-websocket-manager"
import type { TickData } from "@/lib/analysis-engine"
import type { DerivSymbol } from "@/hooks/use-deriv"
import { LastDigitsLineChart } from "@/components/charts/last-digits-line-chart"

interface MarketSnapshot {
  price: number | null
  digits: number[]
  tickCount: number
  updatedAt: number
}

interface MarketsTabProps {
  theme: "dark" | "light"
  availableSymbols: DerivSymbol[]
  initialSymbol?: string
}

const HISTORY_LIMIT = 50

function getLastDigit(tick: TickData, pipSize: number) {
  const quote = Number(tick.quote)
  if (!Number.isFinite(quote)) return null
  const decimals = Math.max(0, Math.round(-Math.log10(pipSize || 0.01)))
  return Number(quote.toFixed(decimals).slice(-1))
}

function getStats(digits: number[]) {
  if (!digits.length) return { over: 0, under: 0, even: 0, odd: 0, differs: 0 }
  const total = digits.length
  const over = digits.filter((digit) => digit > 4).length
  const under = total - over
  const even = digits.filter((digit) => digit % 2 === 0).length
  const odd = total - even
  const differs = new Set(digits).size
  return {
    over: Math.round((over / total) * 100),
    under: Math.round((under / total) * 100),
    even: Math.round((even / total) * 100),
    odd: Math.round((odd / total) * 100),
    differs: Math.round((differs / 10) * 100),
  }
}

export default function MarketsTab({ theme, availableSymbols, initialSymbol }: MarketsTabProps) {
  const managerRef = useRef<DerivWebSocketManager | null>(null)
  const unsubscribeRef = useRef(new Map<string, () => void>())
  const pendingRef = useRef(new Map<string, MarketSnapshot>())
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialSymbol ? [initialSymbol] : []))
  const [snapshots, setSnapshots] = useState<Record<string, MarketSnapshot>>({})
  const snapshotsRef = useRef<Record<string, MarketSnapshot>>({})
  const [search, setSearch] = useState("")

  const visibleSymbols = useMemo(() => {
    const query = search.trim().toLowerCase()
    return availableSymbols.filter((item) => !query || `${item.display_name} ${item.symbol} ${item.market_display_name || ""}`.toLowerCase().includes(query))
  }, [availableSymbols, search])

  useEffect(() => {
    managerRef.current = DerivWebSocketManager.getInstance()
    const flushTimer = window.setInterval(() => {
      if (!pendingRef.current.size) return
      const next = Object.fromEntries(pendingRef.current.entries())
      pendingRef.current.clear()
      setSnapshots((current) => {
        const merged = { ...current, ...next }
        snapshotsRef.current = merged
        return merged
      })
    }, 120)

    return () => {
      window.clearInterval(flushTimer)
      unsubscribeRef.current.forEach((unsubscribe) => unsubscribe())
      unsubscribeRef.current.clear()
    }
  }, [])

  useEffect(() => {
    const manager = managerRef.current
    if (!manager) return
    let cancelled = false

    const syncSubscriptions = async () => {
      for (const [symbol, unsubscribe] of unsubscribeRef.current) {
        if (!selected.has(symbol)) {
          unsubscribe()
          unsubscribeRef.current.delete(symbol)
        }
      }

      if (!manager.isConnected()) {
        try {
          await manager.connect()
        } catch {
          return
        }
      }

      for (const item of availableSymbols) {
        if (cancelled || !selected.has(item.symbol) || unsubscribeRef.current.has(item.symbol)) continue
        const callback = (tick: TickData) => {
          const previous = pendingRef.current.get(item.symbol) || snapshotsRef.current[item.symbol] || { price: null, digits: [], tickCount: 0, updatedAt: 0 }
          const digit = getLastDigit(tick, item.pip_size)
          if (digit === null) return
          pendingRef.current.set(item.symbol, {
            price: Number(tick.quote),
            digits: [...previous.digits, digit].slice(-HISTORY_LIMIT),
            tickCount: previous.tickCount + 1,
            updatedAt: Date.now(),
          })
        }
        const unsubscribe = DerivWebSocketManager.subscribe(item.symbol, callback)
        unsubscribeRef.current.set(item.symbol, unsubscribe)
      }
    }

    syncSubscriptions()
    return () => { cancelled = true }
  }, [selected, availableSymbols])

  const toggle = (symbol: string) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(symbol)) next.delete(symbol)
      else next.add(symbol)
      return next
    })
  }

  const selectAll = () => setSelected(new Set(availableSymbols.map((item) => item.symbol)))
  const clearAll = () => setSelected(new Set())
  const isDark = theme === "dark"

  return (
    <section className="w-full min-w-0 space-y-3" aria-label="Live markets analytics">
      <div className={`flex flex-col gap-3 rounded-xl border p-3 xl:flex-row xl:items-center xl:justify-between ${isDark ? "border-white/10 bg-slate-950/70" : "border-slate-200 bg-white"}`}>
        <div className="flex min-w-0 items-center gap-2">
          <div className="rounded-lg bg-indigo-500/15 p-2 text-indigo-400"><Zap className="h-4 w-4" /></div>
          <div><h2 className="text-sm font-bold">Live Markets</h2><p className="text-[10px] text-slate-500">Select markets for real-time digit analytics</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search markets" className={`h-8 w-40 rounded-md border px-2 text-xs outline-none ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"}`} />
          <button type="button" onClick={selectAll} className="flex h-8 items-center gap-1 rounded-md bg-indigo-600 px-2 text-[10px] font-bold text-white"><CheckSquare className="h-3.5 w-3.5" />All</button>
          <button type="button" onClick={clearAll} className={`flex h-8 items-center gap-1 rounded-md border px-2 text-[10px] font-bold ${isDark ? "border-white/10 text-slate-300" : "border-slate-200 text-slate-600"}`}><Square className="h-3.5 w-3.5" />Clear</button>
          <span className="text-[10px] font-semibold text-slate-500">{selected.size} selected</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
        {visibleSymbols.map((item) => {
          const active = selected.has(item.symbol)
          return <button key={item.symbol} type="button" onClick={() => toggle(item.symbol)} className={`flex items-center gap-2 rounded-lg border px-2 py-2 text-left transition-colors ${active ? "border-indigo-500/60 bg-indigo-500/10" : isDark ? "border-white/8 bg-white/[0.02]" : "border-slate-200 bg-white"}`}>
            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${active ? "border-indigo-500 bg-indigo-600 text-white" : "border-slate-500"}`}>{active && <Check className="h-3 w-3" />}</span>
            <span className="min-w-0 truncate text-[10px] font-bold">{item.display_name || item.symbol}</span>
          </button>
        })}
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-2 2xl:grid-cols-3">
        {[...selected].map((symbol) => {
          const item = availableSymbols.find((market) => market.symbol === symbol)
          if (!item) return null
          const snapshot = snapshots[symbol] || { price: null, digits: [], tickCount: 0, updatedAt: 0 }
          const stats = getStats(snapshot.digits)
          return <article key={symbol} className={`min-w-0 overflow-hidden rounded-xl border p-3 ${isDark ? "border-white/10 bg-slate-950/60" : "border-slate-200 bg-white"}`}>
            <div className="mb-2 flex items-center justify-between"><div><h3 className="text-xs font-bold">{item.display_name}</h3><p className="text-[9px] text-slate-500">{item.symbol} · {snapshot.tickCount} ticks</p></div><button type="button" onClick={() => toggle(symbol)} className="text-[10px] text-slate-500 hover:text-red-400">Remove</button></div>
            <div className="mb-2 grid grid-cols-2 gap-2"><div className="rounded-md bg-indigo-500/10 p-2"><p className="text-[9px] uppercase text-slate-500">Price</p><p className="font-mono text-sm font-bold text-indigo-400">{snapshot.price === null ? "—" : snapshot.price}</p></div><div className="rounded-md bg-emerald-500/10 p-2"><p className="text-[9px] uppercase text-slate-500">Last digit</p><p className="font-mono text-sm font-bold text-emerald-400">{snapshot.digits.at(-1) ?? "—"}</p></div></div>
            <LastDigitsLineChart digits={snapshot.digits.slice(-20)} />
            <div className="mt-2 grid grid-cols-3 gap-1 text-[9px]"><Stat label="Over" value={`${stats.over}%`} /><Stat label="Under" value={`${stats.under}%`} /><Stat label="Even" value={`${stats.even}%`} /><Stat label="Odd" value={`${stats.odd}%`} /><Stat label="Differs" value={`${stats.differs}%`} /><Stat label="Samples" value={String(snapshot.digits.length)} /></div>
          </article>
        })}
      </div>
      {!selected.size && <div className={`rounded-xl border border-dashed p-10 text-center text-xs text-slate-500 ${isDark ? "border-white/10" : "border-slate-200"}`}>Select one or more markets above to start live analysis.</div>}
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded bg-slate-500/10 px-1.5 py-1 text-center"><span className="block text-slate-500">{label}</span><strong>{value}</strong></div>
}

export { MarketsTab }
