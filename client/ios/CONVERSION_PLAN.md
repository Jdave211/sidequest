# React Native -> Swift Conversion Plan

## Phase 1 (done)
- Establish split architecture: native client + server API.
- Add SwiftUI app shell and API client.
- Add backend endpoints for sidequest discovery, join requests, and follows.

## Phase 2
- Implement auth in Swift client.
- Replace mocked tabs in Swift with fully backend-driven screens.
- Move image upload flows to server-signed upload URLs.

## Phase 3
- Port profile/setup, sidequest detail, and create-sidequest flows.
- Remove direct Supabase access from client.
- Keep React Native app in read-only maintenance mode.

## Phase 4
- Cutover: make Swift client primary release.
- Remove Expo/RN runtime from production path.
