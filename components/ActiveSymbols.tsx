// components/ActiveSymbols.tsx
"use client";

import React, { useEffect, useState } from "react";
import { DerivWebSocketManager } from "@/lib/deriv-websocket-manager";

interface SymbolInfo {
  display_name: string;
  symbol: string;
  market?: string;
  market_display_name?: string;
  submarket?: string;
  pip_size?: number;
}

const SUPPORTED_SYMBOL_FILTER = (symbol: SymbolInfo) => {
  const name = (symbol.display_name || "").toLowerCase()
  const market = (symbol.market || symbol.market_display_name || "").toLowerCase()
  const sym = (symbol.symbol || "").toUpperCase()

  if (market.includes("synthetic") || name.includes("derived") || name.includes("synthetic")) return true
  if (sym.startsWith("R_") || sym.includes("1HZ") || sym.includes("JUMP") || sym.includes("BOOM") || sym.includes("CRASH")) return true
  return false
}

export default function ActiveSymbols() {
  const [symbols, setSymbols] = useState<SymbolInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true
    const manager = DerivWebSocketManager.getInstance()

    const loadSymbols = async () => {
      try {
        await manager.connect()
        const list = await manager.getActiveSymbols(true)
        if (!isMounted) return

        const filtered = list
          .map((symbol) => ({
            symbol: symbol.symbol,
            display_name: symbol.display_name,
            market: symbol.market,
            market_display_name: symbol.market_display_name,
            submarket: symbol.submarket,
            pip_size: symbol.pip_size,
          }))
          .filter(SUPPORTED_SYMBOL_FILTER)
          .slice(0, 40)

        setSymbols(filtered)
      } catch (err: any) {
        console.error("Failed to load active symbols", err)
        if (isMounted) setError(err?.message || String(err))
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadSymbols()

    return () => {
      isMounted = false
    }
  }, []);

  if (loading) {
    return <div className="mt-6 text-sm text-gray-400">Loading active symbols…</div>;
  }
  if (error) {
    return <div className="mt-6 text-sm text-red-400">Error: {error}</div>;
  }

  return (
    <div className="mt-6">
      <h2 className="mb-3 text-lg font-semibold text-gray-200">Active Symbols</h2>
      <ul className="max-h-48 overflow-y-auto space-y-1 text-sm text-gray-300">
        {symbols.slice(0, 20).map((sym) => (
          <li key={sym.symbol}>
            <span className="font-medium">{sym.display_name}</span>
            <span className="ml-2 text-gray-500">({sym.symbol})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
