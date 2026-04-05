"use client"

type MessageHandler = (message: any) => void

interface TickData {
  quote: number
  lastDigit: number
  epoch: number
  symbol: string
  id?: string
  pipSize?: number
}

interface ConnectionLog {
  type: "info" | "error" | "warning"
  message: string
  timestamp: Date
}

import { DERIV_CONFIG, DERIV_API } from "./deriv-config"
import { extractLastDigit, calculateDecimalCount } from "./digit-utils"

/**
 * Unified Deriv WebSocket Manager — backed by the official @deriv/deriv-api DerivAPIBasic.
 * All public methods are unchanged so every tab, hook, and bot continues to work.
 */
export class DerivWebSocketManager {
  private static instance: DerivWebSocketManager | null = null

  // Raw WebSocket (passed into DerivAPIBasic)
  private ws: WebSocket | null = null
  // Official Deriv API wrapper
  private api: any | null = null

  private messageHandlers: Map<string, MessageHandler[]> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectDelay = 2000
  private heartbeatInterval: NodeJS.Timeout | null = null
  private lastMessageTime = Date.now()
  private messageQueue: any[] = []
  private subscriptions: Map<string, string> = new Map()
  private subscriptionRefCount: Map<string, number> = new Map()
  private connectionPromise: Promise<void> | null = null
  private reqIdCounter = 1000

  private symbolsCache: any[] | null = null
  private symbolsPromise: Promise<any[]> | null = null
  private pipSizeMap: Map<string, number> = new Map()
  private pendingRequests: Map<number, (data: any) => void> = new Map()
  private symbolToSubscriptionMap: Map<string, string> = new Map()
  private activeSubscriptions: Set<string> = new Set()
  private tickCallbacks: Map<string, Set<(tick: TickData) => void>> = new Map()
  
  // New V1 API state
  private accessToken: string | null = null
  private currentAccountId: string | null = null
  private currentEndpoint: "public" | "demo" | "real" = "public"
  
  // Known robust precision fallbacks for synthetic indices (if API metadata is delayed)
  // Pip sizes = number of decimal places in the price quote.
  // These are fallbacks used ONLY before the live API metadata arrives.
  // Verified against Deriv live feeds — update when API changes pip values.
  private readonly COMMON_PIP_SIZES: Record<string, number> = {
    // Standard Volatility Indices
    "R_10":  3,  // Vol 10
    "R_25":  2,  // Vol 25
    "R_50":  4,  // Vol 50
    "R_75":  4,  // Vol 75
    "R_100": 2,  // Vol 100
    // 1-Second Volatility Indices (1HZ)
    "1HZ10V":  2, // Vol 10 1s
    "1HZ15V":  4, // Vol 15 1s  ← was 3 (incorrect last-digit extraction)
    "1HZ25V":  2, // Vol 25 1s
    "1HZ30V":  4, // Vol 30 1s  ← was 3 (incorrect last-digit extraction)
    "1HZ50V":  2, // Vol 50 1s
    "1HZ75V":  2, // Vol 75 1s
    "1HZ90V":  4, // Vol 90 1s  ← was 3 (incorrect last-digit extraction)
    "1HZ100V": 2, // Vol 100 1s
    "1HZ150V": 4, // Vol 150 1s
    "1HZ200V": 3, // Vol 200 1s
    "1HZ250V": 3, // Vol 250 1s
    "1HZ300V": 3, // Vol 300 1s
    // Bear/Bull Market Index
    "1HA100": 2, // Bull Market Index
    "1HA200": 2, // Bear Market Index
    // Jump Indices
    "JUMP10":  3,
    "JUMP25":  3,
    "JUMP50":  3,
    "JUMP75":  3,
    "JUMP100": 3,
    // Jump Daily
    "JD10":  3,
    "JD25":  3,
    "JD50":  3,
    "JD75":  3,
    "JD100": 3,
  }
  
  // Cache for historical data to prevent redundant fetches
  private historyCache: Map<string, { data: TickData[], timestamp: number }> = new Map()
  private readonly CACHE_TTL = 30000 // 30 seconds
  private connectionLogs: ConnectionLog[] = []
  private readonly maxLogs = 100
  private connectionStatusListeners: Set<(status: "connected" | "disconnected" | "reconnecting") => void> = new Set()

  public isAuthorized = false
  private readonly appId = DERIV_CONFIG.APP_ID
  private currentWsUrl: string = DERIV_API.OPTIONS_WS.PUBLIC

  private constructor() { }

  public static getInstance(): DerivWebSocketManager {
    if (!DerivWebSocketManager.instance) {
      DerivWebSocketManager.instance = new DerivWebSocketManager()
    }
    return DerivWebSocketManager.instance
  }

  public getNextReqId(): number {
    return ++this.reqIdCounter
  }

  // ─── Connection ────────────────────────────────────────────────────────────

  public async connect(url?: string, force = false): Promise<void> {
    const targetUrl = url || this.currentWsUrl

    if (!force && this.ws) {
      const state = this.ws.readyState
      if ((state === WebSocket.OPEN || state === WebSocket.CONNECTING) && this.ws.url === targetUrl) {
        if (state === WebSocket.OPEN) {
          this.log("info", "Already connected")
          return Promise.resolve()
        }
        if (this.connectionPromise) return this.connectionPromise
      }
      if (this.ws.url !== targetUrl) {
        this.ws.close()
      }
    }

    this.currentWsUrl = targetUrl
    if (this.connectionPromise) return this.connectionPromise

    this.connectionPromise = new Promise((resolve, reject) => {
      let settled = false
      const settle = (fn: () => void) => { if (!settled) { settled = true; fn() } }

      try {
        console.log("[v0] Connecting via DerivAPIBasic:", this.currentWsUrl)
        this.log("info", `Connecting to ${this.currentWsUrl}`)
        this.notifyConnectionStatus("reconnecting")

        // Create raw WebSocket
        this.ws = new WebSocket(this.currentWsUrl)

        // Wrap with DerivAPIBasic (the bundle uses CommonJS exports)
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const DerivAPIBasic = require('@deriv/deriv-api/dist/DerivAPIBasic')
        const API = DerivAPIBasic?.default ?? DerivAPIBasic
        this.api = new API({ connection: this.ws })

        const connectionTimeout = setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            this.log("error", "Connection timeout after 10 seconds")
            this.ws?.close()
            this.connectionPromise = null
            this.notifyConnectionStatus("disconnected")
            reject(new Error("Connection timeout"))
          }
        }, 10000)

        // Use addEventListener to avoid overwriting DerivAPIBasic's internal .onopen/.onclose handlers
        this.ws.addEventListener('open', () => {
          clearTimeout(connectionTimeout)
          console.log(`[v0] DerivAPIBasic WebSocket connected to ${this.ws?.url}`)
          this.log("info", `Connected to ${this.ws?.url}`)
          this.reconnectAttempts = 0
          this.lastMessageTime = Date.now()
          this.notifyConnectionStatus("connected")
          this.startHeartbeat()
          this.processMessageQueue()
          this.connectionPromise = null
          this.tryAutoAuthorize()
          settle(() => resolve())
        })

        // Route all messages through our existing routeMessage handler
        this.api.onMessage().subscribe(({ data }: { data: any }) => {
          try {
            this.lastMessageTime = Date.now()
            this.routeMessage(data)
          } catch (err) {
            console.error("[v0] Message routing error:", err)
          }
        })

        this.ws.addEventListener('error', (event) => {
          clearTimeout(connectionTimeout)
          // ErrorEvent serialises as {} — extract a human-readable message instead
          const msg = (event as ErrorEvent).message || "WebSocket connection failed"
          console.error("[v0] WebSocket error:", msg, event)
          this.log("error", `WebSocket error: ${msg}`)
          this.connectionPromise = null
          this.notifyConnectionStatus("disconnected")
          this.rejectAllPendingRequests(new Error(msg))
          settle(() => reject(new Error(msg)))
        })

        this.ws.addEventListener('close', (event) => {
          clearTimeout(connectionTimeout)
          const reason = event.reason || `code ${event.code}`
          console.log(`[v0] WebSocket closed (${reason}), reconnecting…`)
          this.log("warning", `WebSocket closed (${reason}), reconnecting…`)
          // Only reject if not already resolved/rejected by error handler
          settle(() => reject(new Error(`WebSocket closed during connection: ${reason}`)))
          this.connectionPromise = null
          this.stopHeartbeat()
          this.notifyConnectionStatus("disconnected")
          this.rejectAllPendingRequests(new Error("WebSocket connection closed"))
          this.handleReconnect()
        })
      } catch (error) {
        console.error("[v0] Connection setup error:", error)
        this.log("error", `Connection setup error: ${error}`)
        this.connectionPromise = null
        this.notifyConnectionStatus("disconnected")
        this.rejectAllPendingRequests(error instanceof Error ? error : new Error(String(error)))
        settle(() => reject(error instanceof Error ? error : new Error(String(error))))
      }
    })

    return this.connectionPromise
  }

  /**
   * Helper for authenticated REST API calls (Deriv V1)
   */
  private async fetchWithAuth(path: string, options: RequestInit = {}): Promise<any> {
    if (!this.accessToken) throw new Error("No access token available")
    
    const url = `${DERIV_API.REST_BASE}${path}`
    const headers = new Headers(options.headers)
    headers.set("Authorization", `Bearer ${this.accessToken}`)
    headers.set("Deriv-App-ID", this.appId)
    
    console.log(`[v0] REST ${options.method || 'GET'} ${url}`)
    
    const response = await fetch(url, { ...options, headers })
    if (!response.ok) {
      const errorText = await response.text()
      try {
        const errorJson = JSON.parse(errorText)
        throw new Error(errorJson.error?.message || `HTTP ${response.status}: ${errorText}`)
      } catch {
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
    }
    return response.json()
  }
  /**
   * New V1 Authorization Flow:
   * 1. Store token.
   * 2. Fetch accounts via REST.
   * 3. Fetch OTP for the first suitable account.
   * 4. Reconnect WS using the OTP URL.
   */
  public async authorize(token: string): Promise<void> {
    if (!token) return
    this.accessToken = token
    
    try {
      this.log("info", "Starting V1 Authorization (REST + OTP)")
      
      // 1. Fetch available accounts
      const accountsRes = await this.fetchWithAuth("/trading/v1/options/accounts")
      const accounts = accountsRes?.accounts || []
      
      if (accounts.length === 0) {
        throw new Error("No trading accounts found for this user.")
      }

      // 2. Pick an account (prefer demo if available, otherwise first one)
      const targetAccount = accounts.find((a: any) => a.account_category === 'demo') || accounts[0]
      this.currentAccountId = targetAccount.account_id
      this.log("info", `Selected account: ${this.currentAccountId} (${targetAccount.account_category})`)

      // 3. Obtain OTP for this account
      const otpRes = await this.fetchWithAuth(`/trading/v1/options/accounts/${this.currentAccountId}/otp`, {
        method: "POST"
      })
      
      const otpUrl = otpRes?.otp_url
      if (!otpUrl) {
        throw new Error("Failed to obtain OTP URL from Deriv API.")
      }

      this.log("info", "OTP obtained. Reconnecting to authenticated environment...")
      
      // 4. Record state and reconnect
      this.currentEndpoint = targetAccount.account_category === 'demo' ? 'demo' : 'real'
      
      // Force a reconnection with the OTP URL
      await this.disconnect()
      await this.connect(otpUrl, true)
      
      this.isAuthorized = true
      
      // 5. Synthesize legacy 'authorize' event from REST data to sync UI/header
      const syntheticAuthorize = {
        msg_type: "authorize",
        authorize: {
          loginid: targetAccount.account_id,
          is_virtual: targetAccount.account_category === 'demo' ? 1 : 0,
          currency: targetAccount.currency,
          balance: parseFloat(targetAccount.balance || "0"),
          landing_company_name: targetAccount.account_category,
          account_list: accounts.map((acc: any) => ({
            loginid: acc.account_id,
            is_virtual: acc.account_category === 'demo' ? 1 : 0,
            currency: acc.currency,
            balance: parseFloat(acc.balance || "0")
          }))
        }
      }
      
      this.emit("authorize", syntheticAuthorize)
      console.log(`[v0] Successfully authorized V1 connection for ${this.currentAccountId}`)
      
    } catch (e) {
      console.error("[v0] V1 Authorization failed:", e)
      this.log("error", `Authorization failed: ${e instanceof Error ? e.message : String(e)}`)
      this.isAuthorized = false
      throw e
    }
  }

  private tryAutoAuthorize() {
    try {
      const token =
        localStorage.getItem('authToken') ||
        localStorage.getItem('clientToken') ||
        localStorage.getItem('deriv_auth_token')
      if (token && token !== 'null' && token.length > 10) {
        this.authorize(token)
      }
    } catch { /* SSR safety */ }
  }

  // ─── Heartbeat & reconnect ─────────────────────────────────────────────────

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.log("error", "Max reconnection attempts reached, resetting counter")
      setTimeout(() => {
        this.reconnectAttempts = 0
        this.handleReconnect()
      }, 60000)
      return
    }
    
    // Switch to fallback URL if primary fails after 3 attempts
    if (this.reconnectAttempts === 3 && this.currentWsUrl.includes("ws.derivws.com")) {
      console.log("[v0] Switching to fallback WebSocket URL due to repeated failures")
      this.currentWsUrl = `${DERIV_API.WEBSOCKET_FALLBACK_V3}?app_id=${this.appId}`
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(1.2, this.reconnectAttempts - 1)
    this.log("info", `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
    setTimeout(() => {
      this.connect(this.currentWsUrl, true).catch((err) => this.log("error", `Reconnection failed: ${err}`))
    }, delay)
  }

  private startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatInterval = setInterval(() => {
      const timeSinceLastMessage = Date.now() - this.lastMessageTime
      if (timeSinceLastMessage > 60000) {
        this.log("warning", "No messages for 60s, reconnecting")
        this.ws?.close()
        return
      }
      if (this.ws?.readyState === WebSocket.OPEN) {
        try {
          this.send({ ping: 1, req_id: this.getNextReqId() })
        } catch (err) {
          this.log("error", `Heartbeat ping failed: ${err}`)
        }
      }
    }, 30000)
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private processMessageQueue() {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      this.send(this.messageQueue.shift())
    }
  }

  // ─── Send ──────────────────────────────────────────────────────────────────

  public send(message: any): void {
    if (this.api && this.ws?.readyState === WebSocket.OPEN) {
      // DerivAPIBasic.send() returns a Promise — suppress unhandled rejection for fire-and-forget
      this.api.send(message).catch(() => { })
    } else if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      this.messageQueue.push(message)
    }
  }

  /**
   * Send a message and await the response via DerivAPIBasic's native Promise API.
   */
  public async sendAndWait(message: any, timeoutMs = 30000): Promise<any> {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.log("[v0] sendAndWait: WebSocket not open, connecting...")
      await this.connect()
    }

    const req_id = message.req_id || this.getNextReqId()
    const payload = { ...message, req_id }
    
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        this.pendingRequests.delete(req_id)
        reject(new Error(`Request ${req_id} timed out after ${timeoutMs}ms`))
      }, timeoutMs)
      
      this.pendingRequests.set(req_id, (data) => {
        clearTimeout(t)
        if (data.error) {
          reject(data.error)
        } else {
          resolve(data)
        }
      })
      
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(payload))
      } else {
        // Double check: if still not open after connect(), queue it
        this.messageQueue.push(payload)
      }
    })
  }

  // ─── Message routing ───────────────────────────────────────────────────────

  private routeMessage(message: any) {
    try {
      if (message.msg_type === "ping" || message.echo_req?.ping) return

      // Resolve pending req_id-based requests (fallback path)
      if (message.req_id) {
        const req_id = Number(message.req_id)
        const callback = this.pendingRequests.get(req_id)

        // Track subscription IDs
        if (message.subscription && !message.error) {
          const symbol = message.echo_req?.ticks || message.echo_req?.underlying_symbol || message.echo_req?.active_symbols
          if (symbol && typeof symbol === 'string') {
            const subId = message.subscription.id
            const existing = this.symbolToSubscriptionMap.get(symbol)
            if (existing && existing !== subId) {
              this.send({ forget: subId, req_id: this.getNextReqId() })
            } else {
              this.subscriptions.set(subId, symbol)
              this.symbolToSubscriptionMap.set(symbol, subId)
              if (!this.subscriptionRefCount.has(subId)) this.subscriptionRefCount.set(subId, 1)
            }
          }
        }

        if (callback) {
          this.pendingRequests.delete(req_id)
          callback(message)
        }
      }

      // Tick handling
      if (message.tick) {
        const symbol = message.tick.underlying_symbol || message.tick.symbol
        if (message.subscription?.id) {
          const subId = message.subscription.id
          const existing = this.symbolToSubscriptionMap.get(symbol)
          if (!existing) {
            this.subscriptions.set(subId, symbol)
            this.symbolToSubscriptionMap.set(symbol, subId)
            if (!this.subscriptionRefCount.has(subId)) this.subscriptionRefCount.set(subId, 1)
          } else if (existing !== subId) {
            this.send({ forget: subId, req_id: this.getNextReqId() })
          }
        }
        const callbacks = this.tickCallbacks.get(symbol)
        if (callbacks) {
          const rawPip = message.tick.pip_size !== undefined ? Number(message.tick.pip_size) : undefined
          if (rawPip !== undefined) this.pipSizeMap.set(symbol, rawPip)
          const pipSize = this.getPipSize(symbol, rawPip)
          const tickData: TickData = {
            quote: message.tick.quote,
            lastDigit: this.extractLastDigit(message.tick.quote, pipSize),
            epoch: message.tick.epoch,
            symbol,
            id: message.subscription?.id,
            pipSize: pipSize,
          }
          callbacks.forEach(cb => cb(tickData))
        }
      }

      // Route by msg_type
      if (message.msg_type) {
        ;(this.messageHandlers.get(message.msg_type) || []).forEach(h => h(message))
      }

      // Legacy msg_type-less messages
      if (!message.msg_type) {
        if (message.proposal) (this.messageHandlers.get('proposal') || []).forEach(h => h(message))
        if (message.buy) (this.messageHandlers.get('buy') || []).forEach(h => h(message))
      }

      if (message.error) (this.messageHandlers.get("error") || []).forEach(h => h(message))
      ;(this.messageHandlers.get("*") || []).forEach(h => h(message))
    } catch (error) {
      console.error("[v0] Error routing message:", error)
    }
  }

  // ─── Message handler registration ─────────────────────────────────────────

  public on(event: string, handler: MessageHandler) {
    if (!this.messageHandlers.has(event)) this.messageHandlers.set(event, [])
    this.messageHandlers.get(event)!.push(handler)
  }

  public off(event: string, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(event)
    if (handlers) {
      const i = handlers.indexOf(handler)
      if (i > -1) handlers.splice(i, 1)
    }
  }

  /**
   * Internal emitter for synthesizing messages (e.g. from V1 REST handshake)
   */
  private emit(event: string, data: any) {
    const handlers = this.messageHandlers.get(event) || []
    const universalHandlers = this.messageHandlers.get("*") || []
    
    // Notify specific event handlers
    handlers.forEach(h => {
      try { h(data) } catch (e) { console.error(`[v0] Error in ${event} handler:`, e) }
    })
    
    // Notify universal handlers
    universalHandlers.forEach(h => {
      try { h(data) } catch (e) { console.error(`[v0] Error in universal handler for ${event}:`, e) }
    })
  }

  // ─── Tick subscriptions ────────────────────────────────────────────────────

  public async subscribeTicks(symbol: string, callback: (tick: TickData) => void): Promise<string> {
    if (!symbol || typeof symbol !== 'string' || symbol.trim() === "") {
      console.warn("[v0] subscribeTicks: Invalid symbol provided:", symbol)
      return ""
    }
    const cleanSymbol = symbol.trim()
    if (!this.tickCallbacks.has(cleanSymbol)) this.tickCallbacks.set(cleanSymbol, new Set())
    this.tickCallbacks.get(cleanSymbol)!.add(callback)

    const existingId = this.symbolToSubscriptionMap.get(cleanSymbol)
    if (existingId) {
      const ref = this.subscriptionRefCount.get(existingId) || 0
      this.subscriptionRefCount.set(existingId, ref + 1)
      return existingId
    }

    if (this.activeSubscriptions.has(cleanSymbol)) {
      return new Promise((resolve) => {
        const check = setInterval(() => {
          const id = this.symbolToSubscriptionMap.get(cleanSymbol)
          if (id) {
            clearInterval(check)
            const ref = this.subscriptionRefCount.get(id) || 0
            this.subscriptionRefCount.set(id, ref + 1)
            resolve(id)
          }
        }, 200)
        setTimeout(() => { clearInterval(check); resolve("") }, 15000)
      })
    }

    this.activeSubscriptions.add(cleanSymbol)

    let lastError: any = null
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[v0] Subscribing to ${cleanSymbol} (attempt ${attempt})`)
        const response = await this.sendAndWait({ ticks: cleanSymbol, subscribe: 1 }, 30000)

        if (response.subscription?.id) {
          const subscriptionId = response.subscription.id
          const existing = this.symbolToSubscriptionMap.get(cleanSymbol)
          if (existing && existing !== subscriptionId) {
            this.send({ forget: subscriptionId, req_id: this.getNextReqId() })
            const ref = this.subscriptionRefCount.get(existing) || 0
            this.subscriptionRefCount.set(existing, ref + 1)
            this.activeSubscriptions.delete(cleanSymbol)
            return existing
          }
          this.subscriptions.set(subscriptionId, cleanSymbol)
          this.symbolToSubscriptionMap.set(cleanSymbol, subscriptionId)
          this.subscriptionRefCount.set(subscriptionId, 1)
          this.activeSubscriptions.delete(cleanSymbol)
          const pipSize = this.getPipSize(cleanSymbol)
          callback({
            quote: response.tick.quote,
            lastDigit: this.extractLastDigit(response.tick.quote, pipSize),
            epoch: response.tick.epoch,
            symbol: cleanSymbol,
            id: subscriptionId,
            pipSize: pipSize,
          })
          return subscriptionId
        }
        throw new Error(response.error?.message || "Invalid subscription response")
      } catch (error: any) {
        lastError = error
        if (error.code === 'AlreadySubscribed') {
          await new Promise(r => setTimeout(r, 1000))
          const recoveredId = this.symbolToSubscriptionMap.get(cleanSymbol)
          if (recoveredId) {
            const ref = this.subscriptionRefCount.get(recoveredId) || 0
            this.subscriptionRefCount.set(recoveredId, ref + 1)
            this.activeSubscriptions.delete(cleanSymbol)
            return recoveredId
          }
        }
        if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt))
      }
    }

    this.activeSubscriptions.delete(cleanSymbol)
    console.error(`[v0] Failed to subscribe to ${cleanSymbol}:`, lastError)
    return ""
  }

  public async unsubscribe(subscriptionId: string, callback?: (tick: TickData) => void) {
    if (!subscriptionId || typeof subscriptionId !== 'string') return
    const symbol = this.subscriptions.get(subscriptionId)
    if (symbol && callback) {
      const cbs = this.tickCallbacks.get(symbol)
      if (cbs) {
        cbs.delete(callback)
        if (cbs.size === 0) this.tickCallbacks.delete(symbol)
      }
    }
    const ref = this.subscriptionRefCount.get(subscriptionId) || 1
    if (ref > 1) {
      this.subscriptionRefCount.set(subscriptionId, ref - 1)
      return
    }
    if (symbol) {
      this.symbolToSubscriptionMap.delete(symbol)
      this.tickCallbacks.delete(symbol)
    }
    try {
      this.send({ forget: subscriptionId, req_id: this.getNextReqId() })
      this.subscriptions.delete(subscriptionId)
      this.subscriptionRefCount.delete(subscriptionId)
    } catch (error) {
      console.error("[v0] Unsubscribe error:", error)
    }
  }

  public async unsubscribeAll() {
    this.send({ forget_all: ["ticks"], req_id: this.getNextReqId() })
    this.subscriptions.clear()
    this.subscriptionRefCount.clear()
    this.symbolToSubscriptionMap.clear()
    this.tickCallbacks.clear()
    this.log("info", "Unsubscribed from all ticks")
  }

  // ─── History ───────────────────────────────────────────────────────────────

  /**
   * Fetch historical ticks for a symbol with caching.
   */
  /**
   * Fetch historical ticks for a symbol.
   * Deriv API hard-limit: 5000 ticks per request (documented at developers.deriv.com).
   * Requesting more than 5000 returns an error; the API will silently cap at 5000.
   */
  public async getTicksHistory(symbol: string, count = 5000): Promise<TickData[]> {
    if (!symbol || typeof symbol !== 'string') {
      return []
    }
    const cleanSymbol = symbol.trim()
    if (cleanSymbol === "") return []

    // Check cache first
    const cached = this.historyCache.get(cleanSymbol)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL && cached.data.length >= count) {
      this.log("info", `Returning ${count} cached historical ticks for ${cleanSymbol}`)
      return cached.data.slice(-count)
    }

    try {
      this.log("info", `Fetching ${count} historical ticks for ${cleanSymbol}`)
      const response = await this.sendAndWait({
        ticks_history: cleanSymbol,
        adjust_start_time: 1,
        count,
        end: 'latest',
        style: 'ticks'
      })

      if (response.history) {
        const prices = Array.isArray(response.history.prices) ? response.history.prices : []
        const times = Array.isArray(response.history.times) ? response.history.times : []
        const pipSize = this.getPipSize(symbol)
        
        const data = prices.map((price: number, i: number) => ({
          quote: price,
          lastDigit: this.extractLastDigit(price, pipSize),
          epoch: times[i],
          symbol,
          pipSize: pipSize
        }))

        // Update cache
        this.historyCache.set(symbol, { data, timestamp: Date.now() })
        
        return data
      }
      return []
    } catch (error: any) {
      this.log("error", `getTicksHistory failed for ${cleanSymbol}: ${error.message || JSON.stringify(error)}`)
      console.error("[v0] getTicksHistory error:", error)
      return []
    }
  }

  // ─── Active symbols ────────────────────────────────────────────────────────

  public async getActiveSymbols(): Promise<Array<{ symbol: string; display_name: string; market?: string; market_display_name?: string }>> {
    if (this.symbolsCache) return this.symbolsCache
    if (this.symbolsPromise) return this.symbolsPromise

    this.symbolsPromise = (async () => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await this.sendAndWait({ active_symbols: "brief" }, 15000)
          if (response?.active_symbols) {
            this.symbolsCache = response.active_symbols.map((s: any) => {
              const symbol = s.underlying_symbol || s.symbol || ""
              const display_name = s.underlying_symbol_name || s.display_name || symbol
              const market = s.market || "unknown"
              const market_display_name = s.market_display_name || market
              const submarket = s.submarket || "unknown"
              const submarket_display_name = s.submarket_display_name || submarket
              
              const rawPip = s.pip_size !== undefined ? s.pip_size : s.pip
              const decimalCount = rawPip !== undefined ? this.getDecimalCount(rawPip) : 2
              this.pipSizeMap.set(symbol, decimalCount)
              
              // Map all properties from original symbol to prevent library crashes (like useCache)
              return { 
                ...s,
                symbol, 
                display_name, 
                market, 
                market_display_name, 
                submarket,
                submarket_display_name,
                pip_size: decimalCount 
              }
            })
            console.log(`[v0] Loaded ${this.symbolsCache?.length} symbols`)
            return this.symbolsCache!
          }
          throw new Error("Invalid symbols response")
        } catch (error) {
          console.error(`[v0] getActiveSymbols attempt ${attempt} failed:`, error)
          if (attempt === 3) { this.symbolsCache = []; return this.symbolsCache }
          await new Promise(r => setTimeout(r, 2000 * attempt))
        }
      }
      return []
    })()

    return this.symbolsPromise.finally(() => { this.symbolsPromise = null })
  }

  // ─── Utilities ─────────────────────────────────────────────────────────────

  public getPipSize(symbol: string, rawHint?: number): number {
    // 1. Use API metadata cache if available (Most reliable)
    if (this.pipSizeMap.has(symbol)) {
      return this.pipSizeMap.get(symbol)!
    }

    // 2. Use raw hint from the current message if provided (Convert if float)
    if (rawHint !== undefined && !isNaN(rawHint)) {
      return this.getDecimalCount(rawHint)
    }

    // 3. Robust hardcoded fallbacks (When API metadata is missing)
    for (const [key, size] of Object.entries(this.COMMON_PIP_SIZES)) {
      if (symbol === key || symbol.includes(key)) return size
    }
    
    return 2 // Final fallback
  }

  public extractLastDigit(quote: number, pipSize: number): number {
    return extractLastDigit(quote, pipSize)
  }

  public getDecimalCount(pip: number): number {
    return calculateDecimalCount(pip)
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  public async disconnect(): Promise<void> {
    this.stopHeartbeat()
    this.unsubscribeAll()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.api = null
    this.isAuthorized = false
    this.log("info", "Disconnected")
    this.notifyConnectionStatus("disconnected")
  }

  // ─── Logging ───────────────────────────────────────────────────────────────

  private log(type: "info" | "error" | "warning", message: string) {
    this.connectionLogs.push({ type, message, timestamp: new Date() })
    if (this.connectionLogs.length > this.maxLogs) this.connectionLogs.shift()
  }

  public getConnectionLogs(): ConnectionLog[] { return [...this.connectionLogs] }

  // ─── Connection status listeners ───────────────────────────────────────────

  public onConnectionStatus(callback: (status: "connected" | "disconnected" | "reconnecting") => void): () => void {
    this.connectionStatusListeners.add(callback)
    return () => this.connectionStatusListeners.delete(callback)
  }

  private notifyConnectionStatus(status: "connected" | "disconnected" | "reconnecting") {
    this.connectionStatusListeners.forEach(cb => cb(status))
  }

  private rejectAllPendingRequests(error: Error) {
    this.pendingRequests.forEach((cb, req_id) => {
      cb({ error: { message: error.message, code: "ConnectionLoss" }, req_id })
    })
    this.pendingRequests.clear()
  }

  // ─── Static helpers ────────────────────────────────────────────────────────

  public static subscribe(symbol: string, callback: (data: TickData) => void): () => void {
    const instance = DerivWebSocketManager.getInstance()
    let subscriptionId: string | null = null
    let isCancelled = false

    instance.subscribeTicks(symbol, callback).then((id) => {
      if (isCancelled && id) instance.unsubscribe(id, callback)
      else subscriptionId = id
    })

    return () => {
      isCancelled = true
      if (subscriptionId) instance.unsubscribe(subscriptionId, callback)
    }
  }

  public async connectOptions(type: "demo" | "real" | "public", otp?: string): Promise<void> {
    const typeKey = type.toUpperCase() as keyof typeof DERIV_API.OPTIONS_WS
    let baseUrl: string = DERIV_API.OPTIONS_WS[typeKey]
    
    // If we are currently on fallback, adjust sub-endpoints too
    if (this.currentWsUrl.includes("binaryws.com")) {
      baseUrl = baseUrl.replace("api.derivws.com/trading/v1/options/ws", "ws.binaryws.com/websockets/v3")
    }
    
    const url = otp ? `${baseUrl}?otp=${otp}` : baseUrl
    return this.connect(url as string, true)
  }
}

export const derivWebSocket = DerivWebSocketManager.getInstance()
