import Foundation

@MainActor
final class DiscoverViewModel: ObservableObject {
    @Published var items: [SidequestItem] = []
    @Published var query: String = ""
    @Published var isLoading = false
    @Published var isSubmitting = false
    @Published var errorMessage: String?

    private let api: APIClient

    init(api: APIClient = .shared) {
        self.api = api
    }

    func load(scope: String, query overrideQuery: String? = nil) async {
        isLoading = true
        errorMessage = nil

        let search = (overrideQuery ?? query).trimmingCharacters(in: .whitespacesAndNewlines)
        do {
            items = try await api.fetchSidequests(scope: scope, query: search)
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    func createSidequest(
        userId: UUID,
        title: String,
        description: String,
        location: String?,
        category: String = "other"
    ) async -> Bool {
        isSubmitting = true
        errorMessage = nil
        defer { isSubmitting = false }

        do {
            _ = try await api.createSidequest(
                payload: CreateSidequestPayload(
                    userId: userId,
                    title: title,
                    description: description,
                    location: location?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == true ? nil : location,
                    category: category,
                    imageUrls: []
                )
            )
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    func requestJoin(for item: SidequestItem, requesterId: UUID, requesterName: String) async {
        do {
            try await api.requestJoin(
                sidequestId: item.id,
                payload: JoinRequestPayload(
                    requesterId: requesterId,
                    requesterName: requesterName,
                    message: "Would love to join this sidequest."
                )
            )
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func follow(hostUserId: UUID, followerId: UUID) async {
        do {
            try await api.followHost(hostUserId: hostUserId, followerId: followerId)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
