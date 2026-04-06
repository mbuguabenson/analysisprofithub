/**
 * Deriv API Configuration
 *
 * Official Deriv API Documentation:
 * - API Reference: https://developers.deriv.com/docs/
 * - WebSocket Specifications: https://developers.deriv.com/docs/websocket/
 * 
 * Official Deriv GitHub Repositories:
 * - Main Deriv App (DTrader, Cashier, Account, Bot Web UI): https://github.com/deriv-com/deriv-app
 * - SmartTrader Platform: https://github.com/deriv-com/deriv-smarttrader
 * - Deriv API (WebSocket): https://github.com/deriv-com/deriv-api
 * - Deriv Copy Trading: https://github.com/deriv-com/copy-trading
 * - DBot: https://github.com/deriv-com/deriv-bot
 * - Derivatives Base (optional): https://github.com/deriv-com/derivatives
 */

export const DERIV_APP_ID = "32KGABH3pjSMkQ6JTotTG" // Modern Options V1 App ID
export const OAUTH_CLIENT_ID = "32KGABH3pjSMkQ6JTotTG" // Modern PKCE OAuth Client ID

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
  // Official Deriv API Endpoints
  // Priority: V1 Options API is the modern standard
  WEBSOCKET: `wss://api.derivws.com/trading/v1/options/ws/public?app_id=${DERIV_APP_ID}`,
  WEBSOCKET_V3: `wss://ws.derivws.com/websockets/v3?app_id=${DERIV_APP_ID}`,
  OAUTH: "https://oauth.deriv.com/oauth2/authorize",
  // New Options API (REST)
  REST_BASE: "https://api.derivws.com",
  // New Options API (WebSocket - paths)
  OPTIONS_WS: {
    DEMO: `wss://api.derivws.com/trading/v1/options/ws/demo?app_id=${DERIV_APP_ID}`,
    REAL: `wss://api.derivws.com/trading/v1/options/ws/real?app_id=${DERIV_APP_ID}`,
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
