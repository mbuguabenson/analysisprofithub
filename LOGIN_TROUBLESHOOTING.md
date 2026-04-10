# Deriv API v1 Login Troubleshooting Guide

## Issues Fixed in This Update

### ✅ Issue 1: "Missing a valid app_id" Error (Older Accounts)
**Problem**: When logging in with older accounts, getting error:
```
The request is missing a valid app_id.
```

**Root Cause**: 
- OAuth endpoint was pointing to `https://auth.deriv.com/oauth2/auth` (legacy)
- Should be `https://oauth.deriv.com/oauth2/authorize` (v1)
- The `app_id` parameter wasn't always included in the OAuth request

**Fixed In**:
- `hooks/use-deriv-auth.ts` (line 304)
- Now uses correct v1 OAuth endpoint: `https://oauth.deriv.com/oauth2/authorize`
- Always includes `app_id` parameter in request

---

### ✅ Issue 2: Missing Account Balance (Newer Accounts)
**Problem**: When logging in with newer accounts, redirected back to login without showing account balance.

**Root Causes**:
1. REST client not sending `app_id` as query parameter (only in header)
2. Newer accounts don't return `account_list` in authorize response
3. No fallback when account_list is missing

**Fixed In**:

#### Fix 1: REST Client (lib/deriv-rest-client.ts)
- Now appends `app_id` as query parameter: `?app_id=YOUR_APP_ID`
- Adds enhanced logging for debugging
- Better error handling with detailed logs

#### Fix 2: Account List Fallback (hooks/use-deriv-auth.ts)
- Added fallback when `account_list` is missing
- Creates single account entry from `authorize` response data
- Uses current balance from authorization response
- Properly caches account data

---

## Browser Console Debugging

When testing login, open **Browser DevTools (F12)** and check the console for these logs:

### Successful OAuth Flow
```
[v0] 🔐 Starting Modern OAuth 2.0 PKCE login flow...
[v0] 🔐 Redirecting to Deriv OAuth URL: https://oauth.deriv.com/oauth2/authorize?...
[v0] 🔑 Exchanging authorization code for tokens...
[v0] ✅ Token exchange successful
[v0] Initializing baseline DerivAPIClient with App ID: 32KGABH3pjSMkQ6JTotTG
[v0] Authorizing global client with V1 flow...
[v0] ✅ Authorization successful for: USER_LOGIN_ID
[v0] 💰 Balance update: 10000 for USER_LOGIN_ID
```

### If You See "Missing app_id" Error
Check the Deriv OAuth URL in the redirect:
- Should include: `app_id=32KGABH3pjSMkQ6JTotTG`
- Should use: `https://oauth.deriv.com/oauth2/authorize`

### If Account Balance is Missing
Check the console for:
```
[v0] 🌐 REST Request: {
  url: ".../trading/v1/options/accounts?app_id=***",
  hasAuth: true,
  method: "GET"
}
[v0] ✅ V1 Account: No account_list in authorize, using current account data
```

---

## Testing Checklist

### Test 1: Older Account Login
1. Click "Login" button
2. Authorize with old Deriv account credentials
3. **Expected**: Should see account balance and name
4. **Check logs**: Should show successful authorization
5. **If fails**: Check if OAuth app is registered with correct app_id

### Test 2: New Account Login
1. Click "Login" button
2. Authorize with new Deriv account credentials
3. **Expected**: Should see account balance without redirect
4. **Check logs**: Should show "No account_list in authorize, using current account data"
5. **If fails**: Check REST endpoint is returning proper response

### Test 3: Token Validation
1. Open browser DevTools → Application → Local Storage
2. After login, should see: `deriv_api_token` = long string
3. Token should be present during entire session
4. Should clear on logout

### Test 4: Account Switching
1. Login with account that has multiple accounts
2. Click account dropdown
3. Select different account
4. **Expected**: Balance updates immediately
5. **Check logs**: Should show "Switching account to: USER_ID"

---

## Common Issues & Solutions

### Issue: "Invalid state parameter (CSRF protection)"
**Cause**: Session storage cleared or browser doesn't support sessionStorage
**Solution**: 
- Check browser's private/incognito mode
- Clear all storage and try again
- Check sessionStorage is enabled

### Issue: OAuth redirects to login page repeatedly
**Cause**: 
- Redirect URI not registered in Deriv OAuth app
- Token exchange failing
**Solution**:
1. Go to https://app.deriv.com/account/api-token
2. Find your OAuth app
3. Verify "Redirect URI" includes: `https://YOUR_DOMAIN.com/api/auth/callback`
4. For localhost: `http://localhost:3000/api/auth/callback`

### Issue: REST client returns 401 error
**Cause**: Token expired or `app_id` not matching
**Solution**:
- Logout and login again
- Verify `DERIV_APP_ID` in `lib/deriv-config.ts` matches your OAuth app
- Check token is valid: `localStorage.getItem('deriv_api_token')`

### Issue: WebSocket connects but no trades execute
**Cause**: OTP URL might be expired or incorrect endpoint
**Solution**:
- Logout and login again (gets new OTP)
- Check `connectOptions()` is called with correct account type
- Verify WebSocket URL includes OTP: `?otp=...`

---

## Testing Commands (Browser Console)

```javascript
// Check current token
console.log(localStorage.getItem('deriv_api_token'))

// Check stored accounts
console.log(JSON.parse(localStorage.getItem('deriv_last_balances') || '{}'))

// Check active login
console.log(localStorage.getItem('active_login_id'))

// Clear all Deriv data (WARNING: clears session)
['deriv_api_token', 'deriv_auth_tokens', 'active_login_id', 'deriv_last_balances'].forEach(k => localStorage.removeItem(k))

// Check OAuth state storage
console.log({
  state: sessionStorage.getItem('oauth_state'),
  verifier: sessionStorage.getItem('pkce_code_verifier')
})
```

---

## API Endpoints Being Used

### OAuth Flow
- **Start**: `https://oauth.deriv.com/oauth2/authorize` ✅ (Fixed)
- **Token Exchange**: `https://auth.deriv.com/oauth2/token`
- **Redirect**: `/api/auth/callback`

### REST API (V1)
- **Base**: `https://api.derivws.com`
- **Accounts**: `GET /trading/v1/options/accounts?app_id=YOUR_APP_ID` ✅ (Fixed)
- **OTP**: `POST /trading/v1/options/accounts/{id}/otp?app_id=YOUR_APP_ID`

### WebSocket (V1)
- **Public**: `wss://api.derivws.com/trading/v1/options/ws/public?app_id=YOUR_APP_ID`
- **Demo**: `wss://api.derivws.com/trading/v1/options/ws/demo?otp=...`
- **Real**: `wss://api.derivws.com/trading/v1/options/ws/real?otp=...`

---

## Environment Variables Needed

```bash
# In .env.local (development) or Vercel dashboard (production)
# No additional env vars needed - app_id is in lib/deriv-config.ts
# But verify these are present:
NEXT_PUBLIC_DERIV_APP_ID=32KGABH3pjSMkQ6JTotTG
NODE_ENV=development # or 'production'
VERCEL=1 # Set by Vercel automatically
```

---

## File Changes Summary

| File | Changes | Impact |
|------|---------|--------|
| `hooks/use-deriv-auth.ts` | Fixed OAuth endpoint URL, added account list fallback | ✅ Fixes both login issues |
| `lib/deriv-rest-client.ts` | Added `app_id` query parameter, enhanced logging | ✅ REST calls now work properly |
| `lib/deriv-config.ts` | Documentation only (no code changes needed) | ✅ Config already correct |

---

## Next Steps

1. **Clear localStorage**: Logout completely
2. **Clear browser cache**: Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
3. **Open DevTools**: F12 and switch to Console tab
4. **Try login again**: Click Login button
5. **Monitor logs**: Watch console for [v0] messages
6. **Test both accounts**: Try old and new Deriv accounts

---

## Getting Help

If issues persist after these fixes:

1. **Check the logs**: Share screenshot of console errors
2. **Verify app ID**: Confirm `DERIV_APP_ID` in `lib/deriv-config.ts` matches your OAuth app
3. **Test OAuth app**: Verify OAuth app is registered at https://app.deriv.com/account/api-token
4. **Check redirect URI**: Make sure redirect URI is correctly registered
5. **Contact Deriv Support**: Open ticket at https://app.deriv.com/account/contact-us if API issue

---

## Summary of Fixes

✅ **OAuth Endpoint**: Changed from `auth.deriv.com/oauth2/auth` → `oauth.deriv.com/oauth2/authorize`  
✅ **App ID in OAuth**: Now always included in request  
✅ **REST app_id**: Added as query parameter (not just header)  
✅ **Missing Accounts**: Added fallback when account_list is missing  
✅ **Error Handling**: Enhanced logging for debugging  
✅ **Account Balance**: Now displays for both old and new accounts  

Login should now work seamlessly for all Deriv accounts! 🚀
