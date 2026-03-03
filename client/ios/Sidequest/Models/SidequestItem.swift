import Foundation

struct SidequestItem: Codable, Identifiable {
    let id: UUID
    let title: String
    let description: String?
    let location: String?
    let category: String?
    let imageUrls: [String]
    let hostUserId: UUID
    let hostName: String
    let scope: String
    let distanceMiles: Double
    let startsAt: Date
    let interestedCount: Int
}

struct SidequestListResponse: Codable {
    let items: [SidequestItem]
}

struct CreateSidequestPayload: Codable {
    let userId: UUID
    let title: String
    let description: String
    let location: String?
    let category: String
    let imageUrls: [String]
}

struct CreateSidequestResponse: Codable {
    let sidequest: SidequestItem
}

struct JoinRequestPayload: Codable {
    let requesterId: UUID
    let requesterName: String
    let message: String
}

struct JoinRequestResponse: Codable {
    let joinRequest: JoinRequestRecord
}

struct JoinRequestRecord: Codable, Identifiable {
    let id: UUID
    let sidequestId: UUID
    let requesterId: UUID?
    let requesterName: String
    let message: String?
    let status: String
    let createdAt: Date
    let updatedAt: Date
}

struct FollowPayload: Codable {
    let followerId: UUID
}
