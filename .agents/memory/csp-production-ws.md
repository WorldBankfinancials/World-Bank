---
name: CSP for production WebSocket
description: CSP connect-src must include the request host's wss:// URL dynamically or deployed WebSocket connections are blocked.
---

# CSP for Production WebSocket

## The Rule
The Content-Security-Policy middleware in `server/index.ts` must include `wss://${req.headers.host}` in `connect-src` dynamically per request.

**Why:** When deployed on Replit, the app runs under a .replit.app domain. Static CSP only allows localhost WebSockets, blocking the live chat WebSocket in production.

## How to Apply
```typescript
const requestHost = req.headers.host || '';
const productionWs = requestHost ? `wss://${requestHost} ws://${requestHost}` : '';
// Then include productionWs in connect-src along with wss://*.replit.app
```

Also add `https://*.replit.app wss://*.replit.app https://*.replit.dev wss://*.replit.dev` as broad fallbacks.
