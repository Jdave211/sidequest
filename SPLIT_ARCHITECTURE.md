# Split Architecture (Standard)

## Goal
Use a clean boundary:
- `client/ios`: native SwiftUI app
- `server/api`: backend service handling domain logic and DB access

React Native/Expo has been removed from this repository.

## Folders
- `client/ios`: SwiftUI source (new native client)
- `server/api`: Node backend (HTTP + PostgreSQL)
- `migrations`: SQL migrations applied by `node-pg-migrate`

## Request flow
1. SwiftUI client calls `server/api` endpoints.
2. `server/api` validates input and writes/reads PostgreSQL.
3. Database stores core entities and social workflow state.

## Why this is the standard split
- Keeps secrets and write-path logic off the client.
- Makes Swift client thinner and easier to iterate.
- Creates one backend contract usable by iOS/web/other clients.
