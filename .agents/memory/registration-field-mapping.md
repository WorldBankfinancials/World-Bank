---
name: Registration field mapping
description: How register-multi-step and registration.tsx map fields to the backend API
---

## Rule
The `/api/auth/register-complete` endpoint (in `server/fix-routes.ts`) expects `firstName` and `lastName` as separate fields, validated by `registrationSchema` in `server/validation-schemas.ts`.

**register-multi-step.tsx** previously collapsed them into `fullName` — causing every registration to fail with 400. Fixed: now sends `firstName` and `lastName` explicitly.

**registration.tsx** previously had PIN `maxLength={6}` but the backend requires exactly 4 digits. Fixed: `maxLength={4}`.

## Why
The `registrationSchema` uses `z.string().min(1)` on `firstName` and `lastName`. If those keys are missing (or `undefined`), Zod validation fails and the server returns 400.

## How to apply
Any new registration form must send `firstName` and `lastName` as separate string fields, and PIN inputs must enforce exactly 4 digits (`maxLength={4}` + regex `/^\d{4}$/`).
