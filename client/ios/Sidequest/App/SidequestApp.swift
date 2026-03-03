import SwiftUI

@main
struct SidequestApp: App {
    @StateObject private var session = SessionStore()

    var body: some Scene {
        WindowGroup {
            if session.isSignedIn {
                MainTabView()
                    .environmentObject(session)
            } else {
                SignedOutView()
                    .environmentObject(session)
            }
        }
    }
}
