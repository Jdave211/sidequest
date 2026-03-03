import SwiftUI
import Foundation
#if canImport(AuthenticationServices)
import AuthenticationServices
#endif
#if canImport(CryptoKit)
import CryptoKit
#endif
#if canImport(UIKit)
import UIKit
#endif
#if canImport(AppKit)
import AppKit
#endif

enum OAuthProvider: String {
    case google
    case apple
}

private struct SupabaseOAuthConfig {
    let projectURL: URL
    let anonKey: String

    static var current: SupabaseOAuthConfig? {
        let bundle = Bundle.main
        let urlString = (bundle.object(forInfoDictionaryKey: "SUPABASE_URL") as? String)
            ?? ProcessInfo.processInfo.environment["SUPABASE_URL"]
        let anonKey = (bundle.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String)
            ?? ProcessInfo.processInfo.environment["SUPABASE_ANON_KEY"]

        guard
            let value = urlString?.trimmingCharacters(in: .whitespacesAndNewlines),
            let url = URL(string: value),
            let key = anonKey?.trimmingCharacters(in: .whitespacesAndNewlines),
            !value.isEmpty,
            !key.isEmpty
        else {
            return nil
        }

        return SupabaseOAuthConfig(projectURL: url, anonKey: key)
    }
}

private struct SupabaseUser: Decodable {
    struct Metadata: Decodable {
        let fullName: String?
        let name: String?

        enum CodingKeys: String, CodingKey {
            case fullName = "full_name"
            case name
        }
    }

    let id: String
    let email: String?
    let userMetadata: Metadata?

    enum CodingKeys: String, CodingKey {
        case id
        case email
        case userMetadata = "user_metadata"
    }
}

private enum SessionError: LocalizedError {
    case missingAuthConfiguration
    case invalidAuthURL
    case missingAccessToken
    case missingAuthorizationCode
    case missingCodeVerifier
    case invalidIdentityToken

    var errorDescription: String? {
        switch self {
        case .missingAuthConfiguration:
            return "Missing SUPABASE_URL or SUPABASE_ANON_KEY in iOS Info.plist."
        case .invalidAuthURL:
            return "Failed to build the OAuth URL."
        case .missingAccessToken:
            return "Auth callback returned no access token."
        case .missingAuthorizationCode:
            return "Auth callback returned no authorization code."
        case .missingCodeVerifier:
            return "Sign-in session expired. Please try again."
        case .invalidIdentityToken:
            return "Failed to read Apple identity token."
        }
    }
}

private struct SupabaseTokenResponse: Decodable {
    let accessToken: String
    let refreshToken: String?

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
    }
}

#if canImport(AuthenticationServices)
private final class AuthContextProvider: NSObject, ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
#if canImport(UIKit)
        let scenes = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
        if let keyWindow = scenes.flatMap({ $0.windows }).first(where: { $0.isKeyWindow }) {
            return keyWindow
        }
        return ASPresentationAnchor()
#elseif canImport(AppKit)
        return NSApplication.shared.windows.first ?? ASPresentationAnchor()
#else
        return ASPresentationAnchor()
#endif
    }
}

private final class NativeAppleSignInCoordinator: NSObject, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
    private var continuation: CheckedContinuation<ASAuthorizationAppleIDCredential, Error>?

    func start(nonce: String) async throws -> ASAuthorizationAppleIDCredential {
        try await withCheckedThrowingContinuation { continuation in
            self.continuation = continuation

            let provider = ASAuthorizationAppleIDProvider()
            let request = provider.createRequest()
            request.requestedScopes = [.fullName, .email]
            request.nonce = nonce

            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            controller.performRequests()
        }
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential else {
            continuation?.resume(throwing: SessionError.invalidIdentityToken)
            continuation = nil
            return
        }

        continuation?.resume(returning: credential)
        continuation = nil
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        continuation?.resume(throwing: error)
        continuation = nil
    }

    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
#if canImport(UIKit)
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        if let keyWindow = scenes.flatMap({ $0.windows }).first(where: { $0.isKeyWindow }) {
            return keyWindow
        }
        return ASPresentationAnchor()
#elseif canImport(AppKit)
        return NSApplication.shared.windows.first ?? ASPresentationAnchor()
#else
        return ASPresentationAnchor()
#endif
    }
}
#endif

@MainActor
final class SessionStore: ObservableObject {
    @Published private(set) var isSignedIn: Bool
    @Published var displayName: String
    @Published var username: String
    @Published var userId: UUID
    @Published var isAuthenticating = false
    @Published var authenticatingProvider: OAuthProvider?
    @Published var authErrorMessage: String?

    var hasAuthConfig: Bool { SupabaseOAuthConfig.current != nil }

    private let defaults = UserDefaults.standard
    private let signedInKey = "sidequest.session.isSignedIn"
    private let displayNameKey = "sidequest.profile.displayName"
    private let usernameKey = "sidequest.profile.username"
    private let userIdKey = "sidequest.profile.userId"
    private let accessTokenKey = "sidequest.auth.accessToken"
    private let refreshTokenKey = "sidequest.auth.refreshToken"

    private var accessToken: String?
    private var refreshToken: String?
    private var codeVerifier: String?
#if canImport(AuthenticationServices)
    private var authSession: ASWebAuthenticationSession?
    private let authContextProvider = AuthContextProvider()
    private let nativeAppleSignInCoordinator = NativeAppleSignInCoordinator()
#endif

    init() {
        if defaults.object(forKey: signedInKey) == nil {
            defaults.set(false, forKey: signedInKey)
        }

        if let saved = defaults.string(forKey: userIdKey), let id = UUID(uuidString: saved) {
            userId = id
        } else {
            let id = UUID()
            userId = id
            defaults.set(id.uuidString, forKey: userIdKey)
        }

        displayName = defaults.string(forKey: displayNameKey) ?? "Traveler"
        username = defaults.string(forKey: usernameKey) ?? "@swift_sidequest"
        accessToken = defaults.string(forKey: accessTokenKey)
        refreshToken = defaults.string(forKey: refreshTokenKey)

        isSignedIn = defaults.bool(forKey: signedInKey) && accessToken != nil
    }

    func updateDisplayName(_ value: String) {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        displayName = trimmed
        username = "@\(trimmed.lowercased().replacingOccurrences(of: " ", with: "_"))"
        defaults.set(displayName, forKey: displayNameKey)
        defaults.set(username, forKey: usernameKey)
    }

    func adoptKnownUser(_ id: UUID) {
        guard userId != id else { return }
        userId = id
        defaults.set(id.uuidString, forKey: userIdKey)
    }

    func signIn(with provider: OAuthProvider) async {
        authErrorMessage = nil
        isAuthenticating = true
        authenticatingProvider = provider
        defer {
            isAuthenticating = false
            authenticatingProvider = nil
        }

        do {
            guard let config = SupabaseOAuthConfig.current else {
                throw SessionError.missingAuthConfiguration
            }

            let tokens: (accessToken: String?, refreshToken: String?)
            if provider == .apple {
                let nativeSignIn = try await startNativeAppleSignIn()
                let exchanged = try await exchangeIdTokenForSession(
                    idToken: nativeSignIn.idToken,
                    provider: provider,
                    nonce: nativeSignIn.rawNonce,
                    config: config
                )
                tokens = (exchanged.accessToken, exchanged.refreshToken)
            } else {
                let callbackURL = try await startOAuth(provider: provider, config: config)
                var parsedTokens = parseTokens(from: callbackURL)
                if parsedTokens.accessToken == nil {
                    guard let authCode = parseAuthorizationCode(from: callbackURL) else {
                        throw SessionError.missingAuthorizationCode
                    }
                    guard let verifier = codeVerifier else {
                        throw SessionError.missingCodeVerifier
                    }
                    let exchanged = try await exchangeCodeForSession(code: authCode, codeVerifier: verifier, config: config)
                    parsedTokens = (exchanged.accessToken, exchanged.refreshToken)
                }
                tokens = parsedTokens
            }
            guard let token = tokens.accessToken, !token.isEmpty else { throw SessionError.missingAccessToken }

            let user = try await fetchSupabaseUser(accessToken: token, config: config)
            let emailName: String?
            if let email = user.email {
                emailName = email.split(separator: "@").first.map(String.init)
            } else {
                emailName = nil
            }
            let resolvedName = user.userMetadata?.fullName
                ?? user.userMetadata?.name
                ?? emailName
                ?? "Traveler"

            updateDisplayName(resolvedName)
            if let uuid = UUID(uuidString: user.id) {
                adoptKnownUser(uuid)
            }

            accessToken = token
            refreshToken = tokens.refreshToken
            defaults.set(token, forKey: accessTokenKey)
            defaults.set(tokens.refreshToken, forKey: refreshTokenKey)
            defaults.set(true, forKey: signedInKey)
            isSignedIn = true
            codeVerifier = nil
        } catch {
#if canImport(AuthenticationServices)
            if let authError = error as? ASWebAuthenticationSessionError,
               authError.code == .canceledLogin {
                authErrorMessage = "Sign-in was canceled."
                return
            }
#endif
            authErrorMessage = "Sign-in failed. Please try again."
        }
    }

    func signOut() {
        if let token = accessToken, let config = SupabaseOAuthConfig.current {
            Task {
                var request = URLRequest(url: config.projectURL.appending(path: "auth/v1/logout"))
                request.httpMethod = "POST"
                request.setValue(config.anonKey, forHTTPHeaderField: "apikey")
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
                _ = try? await URLSession.shared.data(for: request)
            }
        }

        accessToken = nil
        refreshToken = nil
        defaults.removeObject(forKey: accessTokenKey)
        defaults.removeObject(forKey: refreshTokenKey)
        defaults.set(false, forKey: signedInKey)
        isSignedIn = false
    }

    private func startOAuth(provider: OAuthProvider, config: SupabaseOAuthConfig) async throws -> URL {
        let verifier = randomCodeVerifier()
        codeVerifier = verifier

        var components = URLComponents(url: config.projectURL.appending(path: "auth/v1/authorize"), resolvingAgainstBaseURL: false)
        components?.queryItems = [
            URLQueryItem(name: "provider", value: provider.rawValue),
            URLQueryItem(name: "redirect_to", value: "sidequest://auth/callback"),
            URLQueryItem(name: "code_challenge", value: codeChallenge(from: verifier)),
            URLQueryItem(name: "code_challenge_method", value: "S256")
        ]
        guard let authURL = components?.url else { throw SessionError.invalidAuthURL }

#if canImport(AuthenticationServices)
        return try await withCheckedThrowingContinuation { continuation in
            let session = ASWebAuthenticationSession(url: authURL, callbackURLScheme: "sidequest") { callbackURL, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }

                guard let callbackURL else {
                    continuation.resume(throwing: SessionError.missingAccessToken)
                    return
                }

                continuation.resume(returning: callbackURL)
            }
            session.presentationContextProvider = authContextProvider
            session.prefersEphemeralWebBrowserSession = true
            authSession = session

            guard session.start() else {
                continuation.resume(throwing: SessionError.invalidAuthURL)
                return
            }
        }
#else
        throw SessionError.invalidAuthURL
#endif
    }

    private func startNativeAppleSignIn() async throws -> (idToken: String, rawNonce: String) {
#if canImport(AuthenticationServices)
        let rawNonce = randomCodeVerifier(length: 32)
        let hashedNonce = sha256(rawNonce)
        let credential = try await nativeAppleSignInCoordinator.start(nonce: hashedNonce)
        guard let tokenData = credential.identityToken, let idToken = String(data: tokenData, encoding: .utf8) else {
            throw SessionError.invalidIdentityToken
        }
        return (idToken, rawNonce)
#else
        throw SessionError.invalidAuthURL
#endif
    }

    private func parseTokens(from callbackURL: URL) -> (accessToken: String?, refreshToken: String?) {
        let fragmentParams = URLComponents(string: "http://callback?\(callbackURL.fragment ?? "")")?.queryItems ?? []
        let queryParams = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false)?.queryItems ?? []
        let all = fragmentParams + queryParams

        let access = all.first(where: { $0.name == "access_token" })?.value
        let refresh = all.first(where: { $0.name == "refresh_token" })?.value
        return (access, refresh)
    }

    private func parseAuthorizationCode(from callbackURL: URL) -> String? {
        URLComponents(url: callbackURL, resolvingAgainstBaseURL: false)?
            .queryItems?
            .first(where: { $0.name == "code" })?
            .value
    }

    private func exchangeCodeForSession(code: String, codeVerifier: String, config: SupabaseOAuthConfig) async throws -> (accessToken: String, refreshToken: String?) {
        var components = URLComponents(url: config.projectURL.appending(path: "auth/v1/token"), resolvingAgainstBaseURL: false)
        components?.queryItems = [URLQueryItem(name: "grant_type", value: "pkce")]
        guard let tokenURL = components?.url else { throw SessionError.invalidAuthURL }

        var request = URLRequest(url: tokenURL)
        request.httpMethod = "POST"
        request.setValue(config.anonKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let body = ["auth_code": code, "code_verifier": codeVerifier]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw APIClientError.server(String(data: data, encoding: .utf8) ?? "Failed to exchange auth code")
        }

        let tokenResponse = try JSONDecoder().decode(SupabaseTokenResponse.self, from: data)
        return (tokenResponse.accessToken, tokenResponse.refreshToken)
    }

    private func exchangeIdTokenForSession(idToken: String, provider: OAuthProvider, nonce: String?, config: SupabaseOAuthConfig) async throws -> (accessToken: String, refreshToken: String?) {
        var components = URLComponents(url: config.projectURL.appending(path: "auth/v1/token"), resolvingAgainstBaseURL: false)
        components?.queryItems = [URLQueryItem(name: "grant_type", value: "id_token")]
        guard let tokenURL = components?.url else { throw SessionError.invalidAuthURL }

        var request = URLRequest(url: tokenURL)
        request.httpMethod = "POST"
        request.setValue(config.anonKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        var body: [String: String] = [
            "provider": provider.rawValue,
            "id_token": idToken
        ]
        if let nonce, !nonce.isEmpty {
            body["nonce"] = nonce
        }
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw APIClientError.server(String(data: data, encoding: .utf8) ?? "Failed to exchange id token")
        }

        let tokenResponse = try JSONDecoder().decode(SupabaseTokenResponse.self, from: data)
        return (tokenResponse.accessToken, tokenResponse.refreshToken)
    }

    private func randomCodeVerifier(length: Int = 64) -> String {
        let charset = Array("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~")
        return String((0..<length).compactMap { _ in charset.randomElement() })
    }

    private func codeChallenge(from verifier: String) -> String {
#if canImport(CryptoKit)
        let digest = SHA256.hash(data: Data(verifier.utf8))
        let data = Data(digest)
#else
        let data = Data(verifier.utf8)
#endif
        return data.base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }

    private func sha256(_ input: String) -> String {
#if canImport(CryptoKit)
        let digest = SHA256.hash(data: Data(input.utf8))
        return digest.map { String(format: "%02x", $0) }.joined()
#else
        return input
#endif
    }

    private func fetchSupabaseUser(accessToken: String, config: SupabaseOAuthConfig) async throws -> SupabaseUser {
        var request = URLRequest(url: config.projectURL.appending(path: "auth/v1/user"))
        request.httpMethod = "GET"
        request.setValue(config.anonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw APIClientError.server(String(data: data, encoding: .utf8) ?? "Failed to fetch user")
        }

        return try JSONDecoder().decode(SupabaseUser.self, from: data)
    }
}

struct MainTabView: View {
    init() {
#if canImport(UIKit)
        let appearance = UITabBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor(AppTheme.panel)
        appearance.shadowColor = UIColor(AppTheme.border)
        UITabBar.appearance().standardAppearance = appearance
        UITabBar.appearance().scrollEdgeAppearance = appearance
#endif
    }

    var body: some View {
        TabView {
            WorldView()
                .tabItem {
                    Image(systemName: "globe")
                    Text("World")
                }

            DiscoverView()
                .tabItem {
                    Image(systemName: "location")
                    Text("Map")
                }

            PlansView()
                .tabItem {
                    Image(systemName: "calendar")
                    Text("Plans")
                }

            ChatsView()
                .tabItem {
                    Image(systemName: "message")
                    Text("Chats")
                }
        }
        .tint(AppTheme.primary)
    }
}

struct SignedOutView: View {
    @EnvironmentObject private var session: SessionStore
    @State private var backgroundFile = SignedOutView.pickRandomBackgroundFile()
    @State private var showAuthErrorAlert = false

    private static let backgroundFiles = [
        "welcome_bg1.png",
        "welcome_bg2.png",
        "welcome_bg3.jpg",
        "welcome_bg4.jpg",
        "welcome_bg5.png",
        "welcome_bg6.png",
        "welcome_bg7.png",
        "welcome_bg8.png",
        "welcome_bg9.png"
    ]

    var body: some View {
        ZStack {
            welcomeBackground

            Color.black.opacity(0.36).ignoresSafeArea()
            LinearGradient(
                colors: [Color.black.opacity(0.08), Color.black.opacity(0.6)],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack {
                Spacer()

                VStack(alignment: .leading, spacing: 0) {
                    Text("Adventures that you can trust.")
                        .font(.system(size: 32, weight: .bold))
                        .foregroundStyle(.white)
                        .multilineTextAlignment(.leading)
                        .lineSpacing(2)

                    Text("Always have a good answer to \"how was your week?\"")
                        .font(.system(size: 16, weight: .regular))
                        .foregroundStyle(.white.opacity(0.82))
                        .multilineTextAlignment(.leading)
                        .lineSpacing(4)
                        .padding(.top, 12)

                    VStack(spacing: 12) {
                        appleButton
                        divider
                        googleButton
                    }
                    .padding(.top, 34)

                }
                .frame(maxWidth: 360, alignment: .leading)
                .padding(.horizontal, 20)
                .padding(.bottom, 48)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .onChange(of: session.authErrorMessage) { _, value in
            showAuthErrorAlert = value != nil
        }
        .alert("Sign-In Error", isPresented: $showAuthErrorAlert) {
            Button("OK") {
                session.authErrorMessage = nil
            }
        } message: {
            Text(session.authErrorMessage ?? "Please try again.")
        }
    }

    private var appleButton: some View {
        let isAppleLoading = session.isAuthenticating && session.authenticatingProvider == .apple
        return Button {
            Task { await session.signIn(with: .apple) }
        } label: {
            HStack(spacing: 10) {
                if isAppleLoading {
                    ProgressView().tint(.white)
                } else {
                    Image(systemName: "apple.logo")
                        .font(.title3.weight(.semibold))
                }
                Text(isAppleLoading ? "Signing In..." : "Continue with Apple")
                    .font(.system(size: 16, weight: .semibold))
            }
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .frame(height: 50)
            .background(Color.black.opacity(0.92))
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
        .disabled(session.isAuthenticating)
        .opacity(session.isAuthenticating ? 0.75 : 1)
    }

    private var googleButton: some View {
        let isGoogleLoading = session.isAuthenticating && session.authenticatingProvider == .google
        return Button {
            Task { await session.signIn(with: .google) }
        } label: {
            HStack(spacing: 10) {
                if isGoogleLoading {
                    ProgressView().tint(.black)
                } else {
                    googleIcon
                }
                Text(isGoogleLoading ? "Signing In..." : "Continue with Google")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(Color.black)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 50)
            .background(Color.white.opacity(0.95))
            .overlay(
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .stroke(Color.white.opacity(0.22), lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
        .disabled(session.isAuthenticating)
        .opacity(session.isAuthenticating ? 0.75 : 1)
    }

    private var divider: some View {
        HStack {
            Rectangle().fill(Color.white.opacity(0.3)).frame(height: 1)
            Text("OR")
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(Color.white.opacity(0.82))
                .padding(.horizontal, 12)
            Rectangle().fill(Color.white.opacity(0.3)).frame(height: 1)
        }
    }

    private var googleIcon: some View {
        Group {
#if canImport(UIKit)
            if let url = Bundle.main.url(forResource: "google_g_logo", withExtension: "png", subdirectory: "WelcomeBackgrounds"),
               let image = UIImage(contentsOfFile: url.path) {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFit()
                    .frame(width: 20, height: 20)
            } else {
                fallbackGoogleIcon
            }
#else
            fallbackGoogleIcon
#endif
        }
    }

    private var fallbackGoogleIcon: some View {
        Text("G")
            .font(.system(size: 20, weight: .bold))
            .foregroundStyle(Color(red: 0.26, green: 0.52, blue: 0.96))
            .frame(width: 20, height: 20)
    }

    private var welcomeBackground: some View {
#if canImport(UIKit)
        if let image = loadBackgroundImage(fileName: backgroundFile) {
            return AnyView(
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .clipped()
                    .ignoresSafeArea()
            )
        }
#endif
        return AnyView(
            LinearGradient(
                colors: [Color(red: 0.06, green: 0.08, blue: 0.13), Color(red: 0.21, green: 0.28, blue: 0.44)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
        )
    }

#if canImport(UIKit)
    private func loadBackgroundImage(fileName: String) -> UIImage? {
        let file = fileName as NSString
        let base = file.deletingPathExtension
        let ext = file.pathExtension
        guard let url = Bundle.main.url(forResource: base, withExtension: ext, subdirectory: "WelcomeBackgrounds") else {
            return nil
        }
        return UIImage(contentsOfFile: url.path)
    }
#endif

    private static func pickRandomBackgroundFile() -> String {
        let now = Date().timeIntervalSince1970 * 1000
        let randomSeed = Int((now * 9301 + 49297).truncatingRemainder(dividingBy: 233_280))
        let randomValue = Double(randomSeed) / 233_280.0
        let timeEntropy = Double(Int(now) % 1000) / 1000.0
        let combined = (timeEntropy + Double.random(in: 0...1) + randomValue).truncatingRemainder(dividingBy: 1.0)
        let index = Int(combined * Double(backgroundFiles.count))
        return backgroundFiles[max(0, min(index, backgroundFiles.count - 1))]
    }
}

private enum TopSheet: String, Identifiable {
    case profile
    case settings
    var id: String { rawValue }
}

private struct SidequestTopBarModifier: ViewModifier {
    @State private var activeSheet: TopSheet?

    func body(content: Content) -> some View {
        content
            .toolbar {
                ToolbarItemGroup(placement: .primaryAction) {
                    Button {
                        activeSheet = .profile
                    } label: {
                        Circle()
                            .fill(Color.white)
                            .frame(width: 34, height: 34)
                            .overlay(Image(systemName: "person.crop.circle").font(.headline).foregroundStyle(AppTheme.textPrimary))
                    }
                    Button {
                        activeSheet = .settings
                    } label: {
                        Circle()
                            .fill(Color.white)
                            .frame(width: 34, height: 34)
                            .overlay(Image(systemName: "gearshape").font(.headline).foregroundStyle(AppTheme.textPrimary))
                    }
                }
            }
            .sheet(item: $activeSheet) { sheet in
                switch sheet {
                case .profile:
                    ProfileView()
                case .settings:
                    SettingsView()
                }
            }
    }
}

struct ProfileView: View {
    @EnvironmentObject private var session: SessionStore
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack(spacing: 18) {
                Circle()
                    .fill(AppTheme.primary.opacity(0.15))
                    .frame(width: 96, height: 96)
                    .overlay(
                        Text(String(session.displayName.prefix(2)).uppercased())
                            .font(.title.weight(.semibold))
                            .foregroundStyle(AppTheme.primary)
                    )
                Text(session.displayName)
                    .font(.title3.weight(.bold))
                Text(session.username)
                    .foregroundStyle(AppTheme.textSecondary)

                VStack(alignment: .leading, spacing: 10) {
                    Label("Hosting social sidequests", systemImage: "sparkles")
                    Label("Open to nearby and far followers", systemImage: "person.2")
                    Label("Share plans directly on the map", systemImage: "map")
                }
                .font(.subheadline.weight(.semibold))
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
                .sidequestCardStyle(radius: 16)

                Spacer()
            }
            .padding(16)
            .background(AppTheme.background.ignoresSafeArea())
            .navigationTitle("Profile")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}

struct SettingsView: View {
    @EnvironmentObject private var session: SessionStore
    @Environment(\.dismiss) private var dismiss

    @State private var search = ""
    @State private var displayName = ""
    @State private var theme: String = "system"

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    Text(session.username)
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(AppTheme.textSecondary)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    HStack(spacing: 10) {
                        Image(systemName: "magnifyingglass")
                            .foregroundStyle(AppTheme.textSecondary)
                        TextField("Search settings", text: $search)
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 12)
                    .sidequestCardStyle(radius: 999)

                    settingSection(title: "Your account") {
                        VStack(spacing: 12) {
                            HStack {
                                Label("Display name", systemImage: "person")
                                Spacer()
                            }
                            .font(.subheadline.weight(.semibold))

                            TextField("Your name", text: $displayName)
                                .textInputAutocapitalization(.words)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 10)
                                .background(Color.white)
                                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                                .overlay(RoundedRectangle(cornerRadius: 10).stroke(AppTheme.border, lineWidth: 1))

                            Button("Save Display Name") {
                                session.updateDisplayName(displayName)
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(AppTheme.primary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .padding(16)
                        .sidequestCardStyle(radius: 16)
                    }

                    settingSection(title: "Security and account access") {
                        VStack(spacing: 0) {
                            settingRow(icon: "lock", title: "Sign out of this device", destructive: false)
                            Divider()
                            Button(role: .destructive) {
                                session.signOut()
                                dismiss()
                            } label: {
                                HStack {
                                    Image(systemName: "rectangle.portrait.and.arrow.right")
                                    Text("Sign Out")
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                }
                                .padding(16)
                            }
                        }
                        .sidequestCardStyle(radius: 16)
                    }

                    settingSection(title: "Appearance") {
                        VStack(spacing: 0) {
                            themeRow(icon: "iphone", title: "Use system theme", value: "system")
                            Divider()
                            themeRow(icon: "sun.max", title: "Light mode", value: "light")
                            Divider()
                            themeRow(icon: "moon", title: "Dark mode", value: "dark")
                        }
                        .sidequestCardStyle(radius: 16)
                    }
                }
                .padding(16)
            }
            .background(AppTheme.background)
            .navigationTitle("Settings")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button("Done") { dismiss() }
                }
            }
            .onAppear {
                displayName = session.displayName
            }
        }
    }

    private func settingSection<Content: View>(title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.headline)
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func settingRow(icon: String, title: String, destructive: Bool) -> some View {
        HStack {
            Image(systemName: icon)
            Text(title)
            Spacer()
            Image(systemName: "chevron.right")
        }
        .foregroundStyle(destructive ? .red : AppTheme.textPrimary)
        .padding(16)
    }

    private func themeRow(icon: String, title: String, value: String) -> some View {
        Button {
            theme = value
        } label: {
            HStack {
                Image(systemName: icon)
                Text(title)
                Spacer()
                if theme == value {
                    Text("Selected")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(AppTheme.primary)
                }
                Image(systemName: "chevron.right")
            }
            .foregroundStyle(AppTheme.textPrimary)
            .padding(16)
        }
    }
}

extension View {
    func sidequestTopBar() -> some View {
        modifier(SidequestTopBarModifier())
    }
}

struct MainTabView_Previews: PreviewProvider {
    static var previews: some View {
        MainTabView()
            .environmentObject(SessionStore())
    }
}
