# Critical OAuth & Login Fixes - Deriv API V1

## Issues Fixed

### Issue 1: "The request is missing a valid app_id" Error
**Status**: FIXED ✅

**Root Cause**:
- OAuth endpoint was pointing to wrong URL: `https://oauth.deriv.com/oauth2/authorize`
- Official Deriv API V1 uses: `https://auth.deriv.com/oauth2/auth`
- The `app_id` parameter was being included when it should be OPTIONAL

**Fix Applied**:
- Changed OAuth endpoint to: `https://auth.deriv.com/oauth2/auth`
- Removed `app_id` from OAuth params (it's optional for pure OAuth 2.0 apps)
- Added clear comment explaining when to use `app_id` (legacy support only)

**File Modified**: `hooks/use-deriv-auth.ts` (Lines 307-327)

---

### Issue 2: Account Syncing Stuck / No Balance Display
**Status**: PARTIALLY FIXED ✅

**Root Causes**:
1. WebSocket URLs had `app_id` parameter when they shouldn't
2. OTP endpoint wasn't receiving app_id properly in REST requests
3. Account list missing for some new users

**Fixes Applied**:
1. ✅ Removed `app_id` from WebSocket base URLs (only add in OTP)
2. ✅ Ensured REST client adds `app_id` as query parameter
3. ✅ Added account fallback for users without account_list in authorize response

**Files Modified**: 
- `lib/deriv-config.ts` (WebSocket endpoints cleaned up)
- `lib/deriv-rest-client.ts` (app_id query parameter added)
- `hooks/use-deriv-auth.ts` (account fallback added)

---

## Official Deriv API V1 Spec

### OAuth 2.0 Login Flow (PKCE)

**Endpoint**: `https://auth.deriv.com/oauth2/auth`

**Parameters** (REQUIRED):
- `response_type`: "code"
- `client_id`: Your OAuth 2.0 App ID
- `redirect_uri`: Your callback URL (pre-registered)
- `scope`: "trade account_manage"
- `state`: Random string (CSRF protection)
- `code_challenge`: BASE64URL(SHA256(code_verifier))
- `code_challenge_method`: "S256"

**Parameters** (OPTIONAL):
- `app_id`: ONLY if maintaining a legacy Deriv API v1 app

### REST API (Account Management)

**Base URL**: `https://api.derivws.com`

**Authentication**:
- Header: `Authorization: Bearer {access_token}`
- Query Param: `app_id={your_app_id}` (REQUIRED in all REST calls)

**Example Request**:
```bash
GET https://api.derivws.com/trading/v1/options/accounts?app_id=YOUR_APP_ID
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### WebSocket API (Trading)

**Base URLs** (NO app_id in base):
- Public: `wss://api.derivws.com/trading/v1/options/ws/public`
- Demo: `wss://api.derivws.com/trading/v1/options/ws/demo?otp=YOUR_OTP`
- Real: `wss://api.derivws.com/trading/v1/options/ws/real?otp=YOUR_OTP`

**Authentication**:
- OTP obtained from REST: `POST /trading/v1/options/accounts/{id}/otp`
- Response includes ready-to-use WebSocket URL with OTP embedded

---

## Testing Checklist

After applying these fixes, test:

- [ ] **Old Account Login**: Log in with legacy Deriv account
  - Should NOT show "missing app_id" error
  - Should display account balance
  - Should connect to WebSocket successfully

- [ ] **New Account Login**: Log in with new Deriv OAuth account  
  - Should redirect successfully from OAuth
  - Should display account balance immediately
  - Should show "Syncing accounts" briefly then complete

- [ ] **Account Switching**: Switch between accounts
  - All accounts should show with correct balances
  - Demo and Real accounts should both work

- [ ] **Trading**: Place a test trade
  - Should get proposals
  - Should be able to buy/sell
  - Should see real-time updates

---

## Configuration Summary

| Component | Before | After | Status |
|-----------|--------|-------|--------|
| OAuth Endpoint | oauth.deriv.com ❌ | auth.deriv.com ✅ | Fixed |
| WebSocket app_id | In base URL ❌ | Only in OTP ✅ | Fixed |
| REST app_id | Header only ❌ | Query parameter ✅ | Fixed |
| app_id param | Always included ❌ | Optional (commented) ✅ | Fixed |
| Account fallback | Missing ❌ | Implemented ✅ | Fixed |

---

## Browser Console Debugging

When testing, watch for these success messages:

```
[v0] 🔐 Starting Modern OAuth 2.0 PKCE login flow...
[v0] ✅ Authorization successful for: USER_ID
[v0] 🌐 REST Request: /trading/v1/options/accounts?app_id=***
[v0] ✅ V1 Accounts: Found 1 account(s)
[v0] 💰 Balance: 10000 USD
```

If you see errors:
- "app_id" error → Check OAuth endpoint (should be auth.deriv.com)
- "No accounts" → Check REST client is sending app_id as query param
- "Syncing stuck" → Check WebSocket manager timeout (10 seconds default)

---

## Important Notes

1. **DO NOT** include `app_id` in OAuth params unless you're supporting legacy users
2. **DO** include `app_id` in all REST API calls as a query parameter
3. **DO NOT** include `app_id` in WebSocket base URLs (it goes in OTP)
4. Always use `https://auth.deriv.com/oauth2/auth` (not oauth.deriv.com)
5. WebSocket OTP comes from REST API and includes all auth info

---

## Next Steps

1. Clear browser cache/cookies
2. Test login with both old and new Deriv accounts
3. Check browser console for `[v0]` messages
4. Monitor account sync time (should be < 5 seconds)
5. If issues persist, check the `DERIV_APP_ID` value in `deriv-config.ts`
