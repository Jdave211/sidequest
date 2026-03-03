# Sidequest Server API

A dedicated backend service for the Swift client.

## Why this split
- `client/ios`: native SwiftUI app
- `server/api`: backend boundary (validation, business logic, DB access)

This avoids direct client writes to the database and keeps domain logic centralized.

## Endpoints
- `GET /health`
- `GET /api/v1/sidequests?scope=near|far|all&q=&limit=`
- `POST /api/v1/sidequests/:id/join-requests`
- `POST /api/v1/hosts/:hostUserId/follow`
- `GET /api/v1/hosts/:hostUserId/followers/count`

## Environment
Required:
- `DATABASE_URL`

Optional:
- `PORT` (default: `4000`)

## Run
From repo root:

```bash
PORT=4000 node server/api/src/index.js
```

Or use package script:

```bash
npm run server:dev
```
