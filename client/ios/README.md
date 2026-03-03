# iOS Swift Client

This folder is the new native client side of the split architecture.

## Structure
- `Sidequest/App`: app entry and tab shell
- `Sidequest/Core`: API config/client
- `Sidequest/Features`: Discover/World/Plans/Chats views
- `Sidequest/Models`: DTOs used by the API

## Run in Xcode
1. Create a new iOS app project in Xcode named `Sidequest`.
2. Set interface to `SwiftUI` and language to `Swift`.
3. Replace generated files with the source files in `client/ios/Sidequest`.
4. Add `SIDEQUEST_API_BASE_URL` to app `Info.plist`.
   - Simulator default: `http://localhost:4000`

## Backend dependency
This client expects `server/api` running locally.
