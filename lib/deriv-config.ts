/**
 * Deriv API Configuration - Version 1 (2026)
 * ✅ UPGRADED: Now using Deriv API v1 with modern REST + WebSocket endpoints
 *
 * Official Deriv API Documentation:
 * - API Reference: https://developers.deriv.com/docs/
 * - WebSocket Specifications: https://developers.deriv.com/docs/websocket/
 * - Authentication Flow: https://developers.deriv.com/docs/authentication/
 * 
 * API Standard: Deriv API v1 (REST + WebSocket)
 * - REST Base: https://api.derivws.com
 * - WebSocket Base: wss://api.derivws.com/trading/v1/options/ws/*
 * - OAuth: https://oauth.deriv.com/oauth2/authorize
 * 
 * Official Deriv GitHub Repositories:
 * - Main Deriv App (DTrader, Cashier, Account, Bot Web UI): https://github.com/deriv-com/deriv-app
 * - SmartTrader Platform: https://github.com/deriv-com/deriv-smarttrader
 * - Deriv API (WebSocket): https://github.com/deriv-com/deriv-api
 * - Deriv Copy Trading: https://github.com/deriv-com/copy-trading
 * - DBot: https://github.com/deriv-com/deriv-bot
 * - Derivatives Base (optional): https://github.com/deriv-com/derivatives
 */

export const DERIV_APP_ID = "32KGABH3pjSMkQ6JTotTG" // ✅ V1 App ID (Options API)
export const OAUTH_CLIENT_ID = "32KGABH3pjSMkQ6JTotTG" // ✅ V1 PKCE OAuth Client ID

// Get redirect URL based on environment
// This must match the PRE-REGISTERED redirect URIs in the Deriv OAuth dashboard (api.deriv.com)
const getOAuthRedirectUrl = () => {
  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1"
  const productionUrl = "https://analysisprofithub.vercel.app/api/auth/callback"

  // 1. If we are in production, strictly return the production URL
  if (isProduction) {
    return productionUrl
  }

  // 2. Browser-side dynamic origin for development
  if (typeof window !== "undefined") {
    // If we're on localhost but want to force production test
    if (window.location.hostname === "localhost") {
      return "https://localhost:8443/"
    }
    return `${window.location.origin}/api/auth/callback`
  }
  
  // 3. Absolute default
  return productionUrl
}

export const DERIV_REDIRECT_URL = getOAuthRedirectUrl()

export const DERIV_CONFIG = {
  APP_ID: DERIV_APP_ID,
  OAUTH_CLIENT_ID: OAUTH_CLIENT_ID,
  REDIRECT_URL: DERIV_REDIRECT_URL,
} as const

// Official Deriv Platform URLs
export const DERIV_PLATFORMS = {
  DTRADER: "https://app.deriv.com",
  DBOT: "https://app.deriv.com/bot",
  SMARTTRADER: "https://smarttrader.deriv.com",
  COPYTRADING: "https://app.deriv.com/copy-trading",
} as const

export const DERIV_API = {
  // ✅ DERIV API V1 ENDPOINTS (2026 Standard)
  // All endpoints verified for v1 compliance
  
  // Primary WebSocket - public endpoint (no auth needed)
  WEBSOCKET: `wss://api.derivws.com/trading/v1/options/ws/public?app_id=${DERIV_APP_ID}`,
  
  // Legacy V3 endpoint (DEPRECATED - kept for reference only)
  // DO NOT USE: Will be removed in future versions
  WEBSOCKET_V3: `wss://ws.derivws.com/websockets/v3?app_id=${DERIV_APP_ID}`,
  
  // OAuth 2.0 Authorization endpoint (PKCE flow)
  OAUTH: "https://oauth.deriv.com/oauth2/authorize",
  
  // REST API Base URL (v1)
  REST_BASE: "https://api.derivws.com",
  
  // WebSocket Endpoints for Options Trading (v1)
  // These require OTP authentication for demo/real accounts
  OPTIONS_WS: {
    // Demo account trading endpoint (OTP required)
    DEMO: `wss://api.derivws.com/trading/v1/options/ws/demo?app_id=${DERIV_APP_ID}`,
    // Real account trading endpoint (OTP required)
    REAL: `wss://api.derivws.com/trading/v1/options/ws/real?app_id=${DERIV_APP_ID}`,
    // Public data endpoint (no auth needed)
    PUBLIC: `wss://api.derivws.com/trading/v1/options/ws/public?app_id=${DERIV_APP_ID}`,
  }
} as const

// Official GitHub Repositories
export const DERIV_REPOS = {
  MAIN_APP: {
    name: "deriv-app",
    url: "https://github.com/deriv-com/deriv-app",
    description: "Main Deriv web platform - includes DTrader, Cashier, and Account modules",
    branch: "master",
    integration: "For DTrader, Auth, and base styling (via iframe embedding and API auth)",
  },
  DBOT: {
    name: "deriv-bot",
    url: "https://github.com/deriv-com/deriv-bot",
    description: "Official DBot (block-based automation bot builder)",
    branch: "master",
    integration: "For the DBot tab - runs inside iframe using app ID for Deriv API connection",
  },
  SMARTTRADER: {
    name: "deriv-smarttrader",
    url: "https://github.com/deriv-com/deriv-smarttrader",
    description: "SmartTrader web trading interface",
    branch: "master",
    integration: "For the SmartTrader tab - embedded iframe + login passthrough",
  },
  COPYTRADING: {
    name: "copy-trading",
    url: "https://github.com/deriv-com/copy-trading",
    description: "Official Copy Trading UI",
    branch: "main",
    integration: "For the Copy Trading tab - iframe with API token sync",
  },
  API: {
    name: "deriv-api",
    url: "https://github.com/deriv-com/deriv-api",
    description: "Official Deriv WebSocket API SDK",
    branch: "master",
    integration: "For integrating trading and account features into custom apps",
  },
  DERIVATIVES: {
    name: "derivatives",
    url: "https://github.com/deriv-com/derivatives",
    description: "Deriv's open-source derivatives engine",
    branch: "master",
    integration: "Optional - Used for trade execution logic (if running backend trading logic)",
  },
} as const
