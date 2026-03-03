# Swift-Only Mode

Expo / React Native is parked for now.

## Active pipeline
- Client: SwiftUI source in `client/ios/Sidequest`
- Server: Node API in `server/api`
- Database: PostgreSQL/Supabase via `node-pg-migrate`

## Commands
- Start server: `npm start` or `npm run server:dev`
- Typecheck Swift client: `npm run swift:check`
- Open Swift workspace in Xcode: `npm run swift:open`
- Run migrations: `npm run migrate:up`

## Legacy Expo (disabled-by-default)
If needed temporarily, use explicit legacy commands:
- `npm run legacy:expo:start`
- `npm run legacy:expo:ios`
- `npm run legacy:expo:android`
