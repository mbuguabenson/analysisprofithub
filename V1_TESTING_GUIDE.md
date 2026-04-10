# Deriv API v1 Testing Guide

## Phase 5: Component Testing & Phase 6: End-to-End System Testing

This document provides step-by-step instructions to validate the Deriv API v1 upgrade across all application features.

---

## Pre-Testing Checklist

Before starting tests, verify:
- All code changes from Phases 1-4 are deployed
- Browser console is open (F12) to monitor logs
- Network tab is open to see API calls
- Fresh instance of the app (hard refresh or new incognito window)

---

## Logging Output Expectations

During successful v1 operations, you should see console logs like:
```
[v0] 🚀 Opening WebSocket: wss://api.derivws.com/trading/v1/options/ws/public?app_id=...
[v0] 🔐 Deriv V1 connectOptions: type=demo, hasOTP=true
[v0] ✅ V1 OTP URL detected: connecting directly
[v0] 📊 Deriv V1 getAccounts: Fetching options accounts
[v0] ✅ V1 Accounts: Found 1 account(s)
[v0]   [1] DOT12345 (demo)
[v0] 💡 V1 Proposal: CALL on R_100 (10 @ stake)
[v0] ✅ V1 Proposal: ID=abc123, Price=45.50
[v0] 🛒 V1 Buy Contract: proposal=abc123, price=45.50
[v0] ✅ V1 Buy Success: contract_id=123456, cost=45.50
```

If you DON'T see these logs, the v1 upgrade may not be working properly.

---

## Test Suite 1: Authentication & Login (Priority: CRITICAL)

### Test 1.1: Initial OAuth Login
**Objective**: Verify OAuth 2.0 PKCE flow with Deriv

**Steps**:
1. Open the app and click "Login with Deriv"
2. Monitor console for: `[v0] 🔐 Deriv V1 OTP Request: Account ...`
3. You should be redirected to https://oauth.deriv.com/oauth2/authorize
4. Sign in with your Deriv account
5. Should return to app with auth token

**Expected Outcomes**:
- ✅ OAuth redirect works
- ✅ Access token received and stored
- ✅ No 401 errors in console
- ✅ Console shows account fetching logs

**Failure Indicators**:
- ❌ Blank page or error on OAuth page
- ❌ "Invalid Client" error
- ❌ Network error (CORS)
- ❌ No `[v0]` logs appearing

**Debugging**:
- Check Network tab → OAuth request
- Verify `DERIV_APP_ID` is correct in config
- Check CORS headers in response
- Verify redirect URL matches OAuth dashboard

---

### Test 1.2: Account Loading
**Objective**: Verify REST API fetch accounts endpoint

**Steps**:
1. After successful login, check console
2. Look for logs: `[v0] 📊 Deriv V1 getAccounts: Fetching options accounts`
3. Should see account list: `[v0] ✅ V1 Accounts: Found X account(s)`
4. Check Network tab for GET /trading/v1/options/accounts

**Expected Outcomes**:
- ✅ Accounts list displays with correct type (demo/real)
- ✅ Account balance shows correctly
- ✅ No network errors (200 status)
- ✅ Response includes account_id and account_type

**Failure Indicators**:
- ❌ 401 Unauthorized
- ❌ 403 Forbidden
- ❌ No accounts found
- ❌ "Missing Authorization header" error

**Debugging**:
- Check Authorization header in Network tab
- Verify token format: `Bearer {token}`
- Check `Deriv-App-ID` header present
- Look for error response in Network tab

---

### Test 1.3: OTP Generation for WebSocket
**Objective**: Verify REST OTP endpoint generates valid WebSocket URL

**Steps**:
1. After account loads, check console for: `[v0] 🔐 Deriv V1 OTP Request: Account DOT...`
2. Look for: `[v0] ✅ V1 OTP URL Generated: wss://api.derivws.com...?otp=***`
3. Check Network tab for POST /trading/v1/options/accounts/{id}/otp
4. Response should contain full wss:// URL

**Expected Outcomes**:
- ✅ OTP URL matches format: `wss://api.derivws.com/trading/v1/options/ws/{type}?otp=...`
- ✅ HTTP 200 response
- ✅ OTP URL is masked in logs (security)

**Failure Indicators**:
- ❌ 404 endpoint not found
- ❌ 401 token expired
- ❌ OTP URL missing in response
- ❌ Invalid URL format

**Debugging**:
- Check Network response body
- Verify account_id is correct
- Check response schema matches: `{ data: { url: "wss://..." } }`

---

### Test 1.4: WebSocket Connection with OTP
**Objective**: Verify WebSocket connects with OTP authentication

**Steps**:
1. After OTP generated, check console for: `[v0] ✅ V1 OTP URL detected: connecting directly`
2. Look for: `[v0] 🚀 Opening WebSocket: wss://api.derivws.com/trading/v1/options/ws/demo?otp=...`
3. Should see: `[v0] DerivAPIBasic WebSocket connected to wss://api.derivws.com...`
4. Check Network tab → WS connection to api.derivws.com

**Expected Outcomes**:
- ✅ WebSocket connects (WS protocol)
- ✅ Connection status shows "connected"
- ✅ OTP is included in URL query params

**Failure Indicators**:
- ❌ WebSocket connection refused
- ❌ 403 OTP invalid/expired
- ❌ WebSocket closes immediately
- ❌ "Unauthorized" message

**Debugging**:
- Check WebSocket Network tab for upgrade response (101)
- Verify OTP URL contains all required params
- Check browser console for security warnings
- Verify wss:// (secure) not ws://

---

## Test Suite 2: Trading Operations (Priority: CRITICAL)

### Test 2.1: Market Data & Symbol Selection
**Objective**: Verify ticks/market data loading

**Steps**:
1. From trading page, select a symbol (e.g., R_100)
2. Check console for symbol loading
3. Chart should load with current price
4. Price should update in real-time (every few seconds)

**Expected Outcomes**:
- ✅ Chart displays with candles/ticks
- ✅ Latest price updates automatically
- ✅ No "Symbol not found" errors
- ✅ Bid/ask prices visible

**Failure Indicators**:
- ❌ Blank chart
- ❌ "Symbol does not exist" error
- ❌ Stale price (not updating)
- ❌ Connection drops

**Debugging**:
- Check WebSocket messages (Network tab)
- Look for `ticks` messages arriving
- Verify symbol name matches API format (e.g., R_100, not VOL100)

---

### Test 2.2: Get Proposal
**Objective**: Verify proposal request returns pricing

**Steps**:
1. On trading page, select a contract type (CALL, PUT, DIGIT, etc.)
2. Set contract parameters (amount, duration)
3. Click "Get Quote" or similar
4. Check console for: `[v0] 💡 V1 Proposal: CALL on R_100...`
5. Should see: `[v0] ✅ V1 Proposal: ID=xyz, Price=45.50`

**Expected Outcomes**:
- ✅ Proposal price displays
- ✅ Payout amount visible
- ✅ Probability shown (if applicable)
- ✅ Response time < 1 second

**Failure Indicators**:
- ❌ "Proposal request failed" error
- ❌ Price shows 0 or negative
- ❌ Timeout after 30+ seconds
- ❌ Invalid contract type error

**Debugging**:
- Check Network tab for proposal request
- Verify contract_type is valid (CALL, PUT, etc.)
- Check amount is positive and valid
- Verify duration meets contract minimum

---

### Test 2.3: Buy Contract
**Objective**: Verify contract purchase executes successfully

**Steps**:
1. Get a valid proposal (Test 2.2)
2. Click "Buy" button
3. Check console for: `[v0] 🛒 V1 Buy Contract: proposal=xyz, price=45.50`
4. Should see: `[v0] ✅ V1 Buy Success: contract_id=123456, cost=45.50`
5. Contract should appear in portfolio

**Expected Outcomes**:
- ✅ Buy completes < 2 seconds
- ✅ Contract ID displayed
- ✅ Purchase price correct
- ✅ Contract appears in "My Contracts" list
- ✅ Balance decreases by purchase amount

**Failure Indicators**:
- ❌ "Insufficient balance" error
- ❌ "Buy request failed" error
- ❌ Proposal expired (>30s old)
- ❌ Contract not appearing in portfolio

**Debugging**:
- Check current balance before buy
- Verify proposal ID hasn't expired
- Check Network tab for buy request/response
- Monitor WebSocket for portfolio subscription update

---

### Test 2.4: Real-Time Portfolio Updates
**Objective**: Verify portfolio updates immediately after buy

**Steps**:
1. Buy a contract (Test 2.3)
2. Immediately check portfolio/my contracts list
3. New contract should appear within 1 second
4. Contract details should be accurate

**Expected Outcomes**:
- ✅ Contract appears instantly
- ✅ Contract details: ID, type, entry price
- ✅ Current price updates every tick
- ✅ Profit/loss calculates correctly

**Failure Indicators**:
- ❌ Contract missing from portfolio
- ❌ Takes >5 seconds to appear
- ❌ Stale contract details
- ❌ Profit/loss incorrect

**Debugging**:
- Check WebSocket portfolio subscription
- Monitor incoming messages for contract updates
- Verify subscription ID is active

---

### Test 2.5: Sell Contract
**Objective**: Verify contract can be sold for current bid price

**Steps**:
1. From portfolio, find an active contract
2. Click "Sell" or right-click menu
3. Check console for: `[v0] 💰 V1 Sell Contract: contract_id=123456, price=...`
4. Should see: `[v0] ✅ V1 Sell Success: contract_id=123456, proceeds=...`
5. Contract should close immediately

**Expected Outcomes**:
- ✅ Sell executes in < 2 seconds
- ✅ Proceeds credited to balance
- ✅ Contract moves to "Closed" section
- ✅ Profit/loss calculated

**Failure Indicators**:
- ❌ "Sell request failed" error
- ❌ Contract won't sell (no bid)
- ❌ Timeout
- ❌ Balance not updated

**Debugging**:
- Verify contract has valid bid price
- Check contract is still active (not expired)
- Monitor balance subscription for update
- Check Network tab for sell request

---

## Test Suite 3: Real-Time Subscriptions (Priority: HIGH)

### Test 3.1: Balance Subscription
**Objective**: Verify real-time balance updates

**Steps**:
1. Start with known balance (e.g., 10,000)
2. Buy a contract
3. Balance should update immediately
4. Monitor console logs

**Expected Outcomes**:
- ✅ Balance updates within 500ms
- ✅ Shows correct amount after purchase
- ✅ Continuous updates when subscribed

**Failure Indicators**:
- ❌ Balance doesn't change
- ❌ Updates delayed >2 seconds
- ❌ Wrong balance amount

---

### Test 3.2: Ticks Subscription (Real-Time Prices)
**Objective**: Verify price ticks arrive continuously

**Steps**:
1. Select a symbol on trading page
2. Watch price updates in chart
3. Check WebSocket messages (Network tab)
4. Should see tick messages arriving every 1-2 seconds

**Expected Outcomes**:
- ✅ New ticks every 1-2 seconds
- ✅ Chart updates smoothly
- ✅ Price never goes backwards (monotonic)

**Failure Indicators**:
- ❌ Ticks stop arriving
- ❌ Large price jumps
- ❌ Subscription ID unknown error

---

### Test 3.3: Contract Updates (proposal_open_contract)
**Objective**: Verify active contract updates

**Steps**:
1. Buy a contract
2. Watch contract details on portfolio page
3. Current spot price should update
4. Profit/loss should update every tick

**Expected Outcomes**:
- ✅ Spot price updates every tick
- ✅ Profit/loss recalculates immediately
- ✅ Status accurate (active/expired/sold)

**Failure Indicators**:
- ❌ Contract details don't update
- ❌ Profit/loss frozen
- ❌ Status shows wrong value

---

## Test Suite 4: Account Management (Priority: MEDIUM)

### Test 4.1: Multiple Account Switching
**Objective**: Verify switching between demo/real accounts

**Steps**:
1. If user has multiple accounts, click account selector
2. Select different account
3. Check console for account switch logs
4. WebSocket should reconnect with new OTP
5. Balance should update to new account's balance

**Expected Outcomes**:
- ✅ Account switches within 2 seconds
- ✅ Balance updates to correct account
- ✅ Portfolio shows correct contracts
- ✅ No connection drops

**Failure Indicators**:
- ❌ Account selector disabled
- ❌ Balance doesn't update
- ❌ Old account's contracts still showing
- ❌ WebSocket disconnects

---

### Test 4.2: Demo Reset Balance
**Objective**: Verify demo account balance reset

**Steps**:
1. On demo account with low balance
2. Look for "Reset Demo Balance" button
3. Click to reset
4. Balance should return to 10,000 (or reset amount)
5. Check console for reset log

**Expected Outcomes**:
- ✅ Reset completes within 2 seconds
- ✅ Balance reflects new amount
- ✅ All contracts closed
- ✅ No errors

**Failure Indicators**:
- ❌ Button not found or disabled
- ❌ 403 "Not a demo account" error
- ❌ Balance not updated
- ❌ Timeout

---

## Test Suite 5: Error Handling (Priority: MEDIUM)

### Test 5.1: Token Expiration (401)
**Objective**: Verify app handles expired tokens gracefully

**Steps**:
1. Login successfully
2. Wait 1+ hour (or trigger manually)
3. Try to make a trade or fetch data
4. App should detect 401 error
5. Should prompt to re-login

**Expected Outcomes**:
- ✅ 401 error caught and handled
- ✅ Re-login prompt appears
- ✅ No white screen or console errors
- ✅ State cleared before re-login

**Failure Indicators**:
- ❌ No error handling
- ❌ Blank page
- ❌ Infinite error loop
- ❌ Console errors

---

### Test 5.2: Network Disconnect (WebSocket)
**Objective**: Verify app reconnects after network loss

**Steps**:
1. Open DevTools → Network tab
2. Buy a contract
3. Simulate network drop: DevTools → Throttle to "Offline"
4. Wait 5 seconds
5. Re-enable network
6. App should attempt reconnect

**Expected Outcomes**:
- ✅ Console shows reconnection attempts
- ✅ WebSocket reconnects automatically
- ✅ Subscriptions resume
- ✅ No data loss

**Failure Indicators**:
- ❌ No reconnection attempts
- ❌ App hangs
- ❌ Subscriptions lost
- ❌ Manual page refresh needed

---

### Test 5.3: Invalid Proposal (Expired)
**Objective**: Verify app handles stale proposals

**Steps**:
1. Get a proposal
2. Wait 60+ seconds
3. Try to buy the old proposal
4. Should get "Proposal expired" error

**Expected Outcomes**:
- ✅ Error message clear
- ✅ User prompted to get new proposal
- ✅ No silent failures

**Failure Indicators**:
- ❌ Buy executes with stale proposal
- ❌ Cryptic error message
- ❌ No guidance on fix

---

## Full End-to-End Test Sequence

Run this complete sequence to validate entire upgrade:

1. **Start**: Fresh browser, clear cache
2. **Login** (Test 1.1-1.4): OAuth → Accounts → OTP → WebSocket
3. **Trade** (Test 2.1-2.5): Symbol → Proposal → Buy → Sell
4. **Monitor** (Test 3.1-3.3): Balance → Ticks → Contracts update in real-time
5. **Account** (Test 4.1-4.2): Switch accounts, reset demo balance
6. **Errors** (Test 5.1-5.3): Handle errors gracefully
7. **Cross-Tab** (Additional): Open same app in 2 tabs, login in one tab, should show in both
8. **Mobile** (Additional): Repeat on mobile browser (iPhone/Android)

---

## Success Criteria Checklist

After all tests pass, confirm:

- ✅ Login works perfectly (OAuth → OTP → WebSocket)
- ✅ Trading operations execute instantly (buy/sell < 2 seconds)
- ✅ Real-time updates flow (balance, ticks, portfolio < 500ms)
- ✅ Error handling is graceful (401, network, expired proposals)
- ✅ All UI tabs functional (trading, account, analytics)
- ✅ No console errors or warnings
- ✅ No memory leaks (monitor heap in DevTools)
- ✅ Mobile responsive (works on iPhone/Android)
- ✅ Cross-tab sync works (logout in one tab = logout in all)
- ✅ Performance acceptable (page load < 3s, proposal < 1s)

---

## If Tests Fail

### Debug Checklist

1. **Check logs first**: Open console (F12), clear, reload, check for `[v0]` logs
2. **Verify config**: Check `DERIV_APP_ID` in `/lib/deriv-config.ts`
3. **Check Network tab**: Look for failed requests (red status codes)
4. **Check endpoints**: Verify URLs match v1 format:
   - WebSocket: `wss://api.derivws.com/trading/v1/options/ws/*`
   - REST: `https://api.derivws.com/trading/v1/options/*`
   - OAuth: `https://oauth.deriv.com/oauth2/authorize`
5. **Check headers**: Verify `Authorization: Bearer {token}` and `Deriv-App-ID` present
6. **Test with public endpoint**: Try public WebSocket (no auth) to isolate auth issues

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| "Invalid Client" on OAuth | Wrong app ID | Update DERIV_APP_ID in config |
| 401 Unauthorized on REST | Missing/expired token | Clear localStorage, re-login |
| WebSocket won't connect | OTP expired | Regenerate OTP immediately before use |
| Proposal not returning | Invalid symbol | Check symbol format (e.g., R_100, EURUSD) |
| Buy fails "Insufficient balance" | Account balance too low | Use demo account or reset balance |
| Real-time updates stop | Subscription lost | Check WebSocket connection status |
| CORS error | Origin not registered | Add origin to OAuth dashboard |

---

## Contact & Support

For issues after upgrade:
- Check this guide first
- Review console logs for `[v0]` messages
- File issue with console output + Network tab screenshots
- Include: Account type (demo/real), symbol, contract type

---

## Phase 6: Completion

Once all Phase 5 tests pass:
1. Mark Phase 5 complete
2. Deploy to production
3. Monitor logs for 24 hours
4. Celebrate! 🎉
