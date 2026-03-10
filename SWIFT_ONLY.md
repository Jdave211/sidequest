# Swift-Only Mode

This repository is Swift client + Node API only.

## Active pipeline
- Client: SwiftUI source in `client/ios/Sidequest`
- Server: Node API in `server/api`
- Database: PostgreSQL/Supabase via `node-pg-migrate`

## Commands
- Start server: `npm start` or `npm run server:dev`
- Typecheck Swift client: `npm run swift:check`
- Open Swift workspace in Xcode: `npm run swift:open`
- Run migrations: `npm run migrate:up`
