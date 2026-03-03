import Foundation

enum APIConfig {
    static let defaultBaseURL = "http://localhost:4000"

    static var baseURL: URL {
        if let urlString = Bundle.main.object(forInfoDictionaryKey: "SIDEQUEST_API_BASE_URL") as? String,
           let url = URL(string: urlString), !urlString.isEmpty {
            return url
        }

        if let envURL = ProcessInfo.processInfo.environment["SIDEQUEST_API_BASE_URL"],
           let url = URL(string: envURL), !envURL.isEmpty {
            return url
        }

        return URL(string: defaultBaseURL)!
    }
}
