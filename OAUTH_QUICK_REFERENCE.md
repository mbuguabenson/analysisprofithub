# Deriv OAuth 2.0 Quick Reference

## Three Critical URLs

| Purpose | URL | Status |
|---------|-----|--------|
| OAuth Authorization | `https://auth.deriv.com/oauth2/auth` | ✅ Correct |
| OAuth Token Exchange | `https://auth.deriv.com/oauth2/token` | ✅ Correct |
| REST API Base | `https://api.derivws.com` | ✅ Correct |
| WebSocket Base | `wss://api.derivws.com/trading/v1/options/ws/*` | ✅ Correct |

## OAuth 2.0 Login Parameters

### Request to Authorization Endpoint

```
GET https://auth.deriv.com/oauth2/auth?
  response_type=code&
  client_id={YOUR_CLIENT_ID}&
  redirect_uri={YOUR_CALLBACK_URL}&
  scope=trade+account_manage&
  state={RANDOM_STATE}&
  code_challenge={PKCE_CHALLENGE}&
  code_challenge_method=S256
```

✅ **DO NOT** add `app_id` here (it's optional and only for legacy support)

### Token Exchange (Backend Only)

```
POST https://auth.deriv.com/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
client_id={YOUR_CLIENT_ID}&
code={AUTH_CODE}&
code_verifier={PKCE_VERIFIER}&
redirect_uri={YOUR_CALLBACK_URL}
```

## REST API Calls

### All REST calls MUST include app_id as query parameter

```bash
# Example: Get accounts
curl -X GET "https://api.derivws.com/trading/v1/options/accounts?app_id=YOUR_APP_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Example: Get OTP for WebSocket
curl -X POST "https://api.derivws.com/trading/v1/options/accounts/ACC_ID/otp?app_id=YOUR_APP_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## WebSocket Connection

### Connect to public endpoint (no auth)
```
wss://api.derivws.com/trading/v1/options/ws/public
```

### Connect to trading endpoint (with OTP)
```
wss://api.derivws.com/trading/v1/options/ws/demo?otp=OTP_FROM_REST_API
wss://api.derivws.com/trading/v1/options/ws/real?otp=OTP_FROM_REST_API
```

✅ **DO NOT** add app_id here - it's in the OTP

## Code Implementation Locations

| Task | File | Lines |
|------|------|-------|
| OAuth login flow | `hooks/use-deriv-auth.ts` | 307-327 |
| REST API calls | `lib/deriv-rest-client.ts` | 26-52 |
| WebSocket config | `lib/deriv-config.ts` | 70-95 |
| Account handling | `hooks/use-deriv-auth.ts` | 101-143 |

## PKCE Generation

```javascript
// 1. Generate code_verifier
const array = crypto.getRandomValues(new Uint8Array(64));
const codeVerifier = Array.from(array)
  .map(v => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'[v % 66])
  .join('');

// 2. Generate code_challenge
const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');

// 3. Store before redirect
sessionStorage.setItem('pkce_code_verifier', codeVerifier);
sessionStorage.setItem('oauth_state', state);
```

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| "missing app_id" | OAuth endpoint wrong | Use `auth.deriv.com` not `oauth.deriv.com` |
| REST 401 | No auth header | Add `Authorization: Bearer token` |
| REST 400 | Missing app_id param | Add `?app_id=...` to URL |
| "No accounts" | Account list missing | Already handled with fallback |
| WebSocket timeout | OTP generation slow | Increase timeout or check REST connection |

## Configuration File

**File**: `lib/deriv-config.ts`

Key values:
```typescript
export const DERIV_APP_ID = "32KGABH3pjSMkQ6JTotTG"  // REST app_id
export const OAUTH_CLIENT_ID = "32KGABH3pjSMkQ6JTotTG"  // OAuth client_id
export const DERIV_API = {
  OAUTH: "https://auth.deriv.com/oauth2/auth",  // ✅ Correct
  REST_BASE: "https://api.derivws.com",
  OPTIONS_WS: {
    DEMO: "wss://api.derivws.com/trading/v1/options/ws/demo",  // ✅ No app_id
    REAL: "wss://api.derivws.com/trading/v1/options/ws/real",  // ✅ No app_id
  }
}
```

## Browser Console Debug

When testing, you should see:

```
[v0] 🔐 Starting Modern OAuth 2.0 PKCE login flow...
[v0] 🌐 REST Request: /trading/v1/options/accounts?app_id=***
[v0] ✅ V1 Accounts: Found 1 account(s)
[v0] ✅ V1 OTP URL Generated: wss://...?otp=***
[v0] ✅ Authorization successful for: USER_LOGIN
[v0] 💰 Balance: 10000 USD
```

No errors about app_id = login is working! ✅
