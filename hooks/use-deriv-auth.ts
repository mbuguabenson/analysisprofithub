"use client"

import { useEffect, useState, useRef } from "react"
import { DerivWebSocketManager } from "@/lib/deriv-websocket-manager"
import { DERIV_CONFIG, DERIV_API, OAUTH_CLIENT_ID, DERIV_REDIRECT_URL } from "@/lib/deriv-config"
import { generateCodeVerifier, generateCodeChallenge, generateState } from "@/lib/pkce"

interface Balance {
  amount: number
  currency: string
}

interface Account {
  id: string
  type: "Demo" | "Real"
  currency: string
  balance: number
}

export function useDerivAuth() {
  const [token, setToken] = useState<string>("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [balance, setBalance] = useState<Balance | null>(null)
  const [accountType, setAccountType] = useState<"Demo" | "Real" | null>(null)
  const [accountCode, setAccountCode] = useState<string>("")
  const [accounts, setAccounts] = useState<Account[]>([])
  const [activeLoginId, setActiveLoginId] = useState<string | null>(null)
  const activeLoginIdRef = useRef<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [balanceSubscribed, setBalanceSubscribed] = useState(false)
  const balanceSubscribedRef = useRef(false)
  const manager = DerivWebSocketManager.getInstance()

  // 1. Stable listener for auth and balance updates
  useEffect(() => {
    const handleAuthMessages = (data: any) => {
      if (data.msg_type === "authorize") {
        setIsInitializing(false)
        if (data.error) {
          console.error("[v0] ❌ Auth error:", data.error.message)
          if (data.error.code === "InvalidToken" || data.error.code === "AuthorizationRequired") {
            setIsLoggedIn(false)
            setActiveLoginId(null)
            activeLoginIdRef.current = null
            setAccountCode("")
            setToken("")

            // Clear invalid credentials so they aren't retried indefinitely
            localStorage.removeItem("deriv_api_token")
            localStorage.removeItem("deriv_auth_tokens")
            localStorage.removeItem("active_login_id")

            setShowTokenModal(true)
          }
          return
        }

        const { authorize } = data
        const accType = authorize.is_virtual ? "Demo" : "Real"

        console.log("[v0] ✅ Authorized:", authorize.loginid, `(${accType})`)
        setAccountType(accType)
        setActiveLoginId(authorize.loginid)
        activeLoginIdRef.current = authorize.loginid
        setAccountCode(authorize.loginid || "")
        setIsLoggedIn(true)
        setShowTokenModal(false)

        if (authorize.balance !== undefined) {
          const initialBalance = {
            amount: Number(authorize.balance),
            currency: authorize.currency || "USD",
          }
          setBalance(initialBalance)
        }

        if (authorize.account_list && Array.isArray(authorize.account_list)) {
          const formatted = authorize.account_list.map((acc: any) => ({
            id: acc.loginid,
            type: acc.is_virtual ? "Demo" : "Real",
            currency: acc.currency,
            balance: Number(acc.balance) || 0,
          }))
          setAccounts(formatted)
        }

        if (!balanceSubscribedRef.current) {
          manager.send({ balance: 1, subscribe: 1 })
          balanceSubscribedRef.current = true
          setBalanceSubscribed(true)
        }
      }

      if (data.msg_type === "balance" && data.balance) {
        const msgLoginId = data.balance.loginid || activeLoginIdRef.current
        console.log("[v0] 💰 Balance update received:", data.balance.balance, data.balance.currency, "for", msgLoginId)
        
        if (msgLoginId === activeLoginIdRef.current) {
          setBalance({
            amount: Number(data.balance.balance),
            currency: data.balance.currency,
          })
        }

        setAccounts(prev => prev.map(acc => {
          if (acc.id === msgLoginId) {
            return { ...acc, balance: Number(data.balance.balance) }
          }
          return acc
        }))
      }
    }

    // Handle connection errors/closures to potentially reset initialization if stuck
    const handleStatus = (status: string) => {
      if (status === "disconnected" && !localStorage.getItem("deriv_api_token")) {
        setIsInitializing(false)
      }
    }

    manager.on("authorize", handleAuthMessages)
    manager.on("balance", handleAuthMessages)
    const unbindStatus = manager.onConnectionStatus(handleStatus)

    return () => {
      manager.off("authorize", handleAuthMessages)
      manager.off("balance", handleAuthMessages)
      unbindStatus()
    }
  }, [])

  useEffect(() => {
    activeLoginIdRef.current = activeLoginId
  }, [activeLoginId])

  useEffect(() => {
    if (typeof window === "undefined") return

    // Legacy OAuth callback handler removed - now handled by /api/auth/callback/page.tsx
    // We only need to check for stored tokens on mount
    const storedToken = localStorage.getItem("deriv_api_token")
    if (storedToken && storedToken.length > 10) {
      setToken(storedToken)
      connectWithToken(storedToken)
    } else {
      console.log("[v0] ℹ️ No session found")
      setIsInitializing(false)
    }
  }, [])

  const connectWithToken = async (apiToken: string) => {
    if (!apiToken || apiToken.length < 10) {
      setIsInitializing(false)
      return
    }

    try {
      // Use the manager's V1 Auth flow (handles REST OTP for trading)
      await manager.authorize(apiToken)
    } catch (e) {
      console.error("[v0] Connection error during auth:", e)
      setIsInitializing(false)
    }
  }

  const submitApiToken = (apiToken: string) => {
    if (!apiToken || apiToken.length < 10) {
      alert("Please enter a valid API token")
      return
    }

    setIsInitializing(true)
    localStorage.setItem("deriv_api_token", apiToken)
    setToken(apiToken)
    connectWithToken(apiToken)
  }

  const openTokenSettings = () => {
    setShowTokenModal(true)
  }

  const loginWithDeriv = async () => {
    console.log("[v0] 🔐 Starting Modern OAuth 2.0 PKCE login flow...")
    if (typeof window === "undefined") return

    try {
      // 1. Generate and store PKCE parameters
      const codeVerifier = generateCodeVerifier()
      const codeChallenge = await generateCodeChallenge(codeVerifier)
      const state = generateState()

      sessionStorage.setItem("pkce_code_verifier", codeVerifier)
      sessionStorage.setItem("oauth_state", state)

      // 2. Build the authorization URL
      const params = new URLSearchParams({
        response_type: "code",
        client_id: OAUTH_CLIENT_ID,
        redirect_uri: DERIV_REDIRECT_URL,
        scope: "trade",
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        app_id: DERIV_CONFIG.APP_ID, // Include legacy ID for routing compatibility
      })

      const oauthUrl = `${DERIV_API.OAUTH}?${params.toString()}`

      console.log("[v0] 🔐 Authorization URL generated. Redirecting...")
      window.location.href = oauthUrl
    } catch (error) {
      console.error("[v0] ❌ OAuth setup error:", error)
    }
  }

  const requestLogin = () => {
    loginWithDeriv()
  }

  const logout = () => {
    if (typeof window === "undefined") return
    manager.send({ forget_all: ["balance", "ticks", "proposal_open_contract"] })
    localStorage.removeItem("deriv_api_token")
    localStorage.removeItem("deriv_auth_tokens")
    localStorage.removeItem("active_login_id")
    setToken("")
    setIsLoggedIn(false)
    setBalance(null)
    setAccounts([])
    setActiveLoginId(null)
    activeLoginIdRef.current = null
    setIsInitializing(false)
    balanceSubscribedRef.current = false
    setBalanceSubscribed(false)
    setShowTokenModal(true)
  }

  const switchAccount = (loginId: string) => {
    if (!loginId || typeof window === "undefined") return
    const storedTokens = JSON.parse(localStorage.getItem("deriv_auth_tokens") || "{}")
    const targetToken = storedTokens[loginId] || token

    if (!targetToken) return

    console.log("[v0] 🔄 Switching account to:", loginId)
    setIsInitializing(true)
    localStorage.setItem("deriv_api_token", targetToken)
    localStorage.setItem("active_login_id", loginId)
    setToken(targetToken)
    
    // Reset subscription flags so authorize handler re-subscribes for the NEW account
    balanceSubscribedRef.current = false
    setBalanceSubscribed(false)
    
    manager.authorize(targetToken).catch(console.error)
  }

  return {
    token,
    isLoggedIn,
    isInitializing,
    isAuthenticated: isLoggedIn,
    loginWithDeriv,
    requestLogin,
    showApprovalModal,
    logout,
    balance,
    accountType,
    accountCode,
    accounts,
    switchAccount,
    activeLoginId,
    showTokenModal,
    submitApiToken,
    openTokenSettings,
  }
}
