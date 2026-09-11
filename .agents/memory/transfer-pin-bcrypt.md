---
name: Transfer PIN verification
description: Transfer PINs are stored as bcrypt hashes; plain string comparison silently fails for all users.
---

# Transfer PIN Verification

## The Rule
Transfer PINs in `bank_users.transfer_pin` are stored as bcrypt hashes. Always use `await bcrypt.compare(plainPin, user.transferPin)`.

**Why:** PINs are hashed on creation. Plain `===` comparison always returns false, blocking all transfers.

## How to Apply
- Import: `import * as bcrypt from 'bcryptjs'`
- Verify: `const valid = await bcrypt.compare(String(pin), user.transferPin)`
- Location: `server/routes-transfer.ts` — both /api/transfers and /api/international-transfers routes
