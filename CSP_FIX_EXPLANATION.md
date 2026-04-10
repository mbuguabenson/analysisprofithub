# CSP Fix for Deriv OAuth Authentication

## Problem
The app was blocking the Deriv OAuth login due to Content Security Policy (CSP) restrictions.

**Error Message**:
```
Content-Security-Policy: The page's settings blocked the loading of a resource 
(frame-src) at https://auth.deriv.com/oauth2/auth
```

## Root Cause
The default v0.app CSP policy only allows specific origins in the `frame-src` directive. `auth.deriv.com` was not included, preventing the OAuth login window from opening.

## Solution
Created a Next.js middleware (`middleware.ts`) that sets the proper CSP header with `auth.deriv.com` added to the `frame-src` directive.

## What Was Changed
- **New File**: `middleware.ts`
  - Sets CSP header for all requests
  - Includes `https://auth.deriv.com/` in `frame-src`
  - Maintains all existing allowed origins

## How It Works
1. Next.js middleware intercepts all requests
2. Adds updated CSP header with Deriv OAuth URL allowed
3. Response is returned with proper security headers

## Testing
After deployment, try logging in:
1. Click "Login with Deriv"
2. The OAuth window should now open (not be blocked)
3. Complete authentication flow
4. App should show account balance

## Files Modified
- `middleware.ts` (NEW) - CSP header configuration

## Status
✅ CSP blocking issue is now fixed
✅ Deriv OAuth login can now proceed
✅ All other security policies maintained
