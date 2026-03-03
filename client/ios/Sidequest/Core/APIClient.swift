import Foundation

enum APIClientError: LocalizedError {
    case invalidResponse
    case server(String)

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Invalid server response"
        case .server(let message):
            return message
        }
    }
}

final class APIClient {
    static let shared = APIClient()

    private let jsonDecoder: JSONDecoder
    private let jsonEncoder: JSONEncoder

    private init() {
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        decoder.dateDecodingStrategy = .iso8601
        jsonDecoder = decoder

        let encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase
        jsonEncoder = encoder
    }

    func fetchSidequests(scope: String, query: String = "", limit: Int = 24) async throws -> [SidequestItem] {
        var components = URLComponents(url: APIConfig.baseURL.appendingPathComponent("api/v1/sidequests"), resolvingAgainstBaseURL: false)
        components?.queryItems = [
            URLQueryItem(name: "scope", value: scope),
            URLQueryItem(name: "q", value: query),
            URLQueryItem(name: "limit", value: String(limit))
        ]

        guard let url = components?.url else { throw APIClientError.invalidResponse }
        let (data, response) = try await URLSession.shared.data(from: url)
        guard let http = response as? HTTPURLResponse else { throw APIClientError.invalidResponse }

        guard (200..<300).contains(http.statusCode) else {
            throw APIClientError.server(String(data: data, encoding: .utf8) ?? "Server error")
        }

        let decoded = try jsonDecoder.decode(SidequestListResponse.self, from: data)
        return decoded.items
    }

    func createSidequest(payload: CreateSidequestPayload) async throws -> SidequestItem {
        let url = APIConfig.baseURL.appendingPathComponent("api/v1/sidequests")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try jsonEncoder.encode(payload)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw APIClientError.invalidResponse }

        guard (200..<300).contains(http.statusCode) else {
            throw APIClientError.server(String(data: data, encoding: .utf8) ?? "Failed to create sidequest")
        }

        return try jsonDecoder.decode(CreateSidequestResponse.self, from: data).sidequest
    }

    func requestJoin(sidequestId: UUID, payload: JoinRequestPayload) async throws {
        let url = APIConfig.baseURL.appendingPathComponent("api/v1/sidequests/\(sidequestId.uuidString)/join-requests")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try jsonEncoder.encode(payload)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw APIClientError.invalidResponse }

        guard (200..<300).contains(http.statusCode) else {
            throw APIClientError.server(String(data: data, encoding: .utf8) ?? "Failed to submit join request")
        }
    }

    func followHost(hostUserId: UUID, followerId: UUID) async throws {
        let url = APIConfig.baseURL.appendingPathComponent("api/v1/hosts/\(hostUserId.uuidString)/follow")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try jsonEncoder.encode(FollowPayload(followerId: followerId))

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw APIClientError.invalidResponse }

        guard (200..<300).contains(http.statusCode) else {
            throw APIClientError.server(String(data: data, encoding: .utf8) ?? "Failed to follow host")
        }
    }
}
