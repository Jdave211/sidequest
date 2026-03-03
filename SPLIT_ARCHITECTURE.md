# Split Architecture (Standard)

## Goal
Move from a single React Native + direct-Supabase app to a clean boundary:
- `client/ios`: native SwiftUI app
- `server/api`: backend service handling domain logic and DB access

React Native/Expo is intentionally parked for now; Swift is the active client path.

## Folders
- `client/ios`: SwiftUI source (new native client)
- `server/api`: Node backend (HTTP + PostgreSQL)
- `migrations`: SQL migrations applied by `node-pg-migrate`
- root Expo app: legacy client kept temporarily for migration safety

## Request flow
1. SwiftUI client calls `server/api` endpoints.
2. `server/api` validates input and writes/reads PostgreSQL.
3. Database stores core entities and social workflow state.

## Why this is the standard split
- Keeps secrets and write-path logic off the client.
- Makes Swift client thinner and easier to iterate.
- Creates one backend contract usable by iOS/web/other clients.
