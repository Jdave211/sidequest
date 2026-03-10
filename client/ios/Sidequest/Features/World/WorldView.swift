import SwiftUI

struct WorldView: View {
    @EnvironmentObject private var session: SessionStore
    @StateObject private var vm = DiscoverViewModel()
    @State private var scope: String = "near"
    @State private var showingAddSheet = false
    @State private var searchTask: Task<Void, Never>?

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 16) {
                    header
                    searchBar
                    scopeSegment

                    if vm.isLoading {
                        ProgressView("Loading sidequests...")
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    if let message = vm.errorMessage {
                        Text(message)
                            .font(.footnote.weight(.semibold))
                            .foregroundStyle(.red)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    ForEach(vm.items) { item in
                        sidequestCard(item)
                    }
                }
                .padding(.horizontal, 18)
                .padding(.top, 10)
                .padding(.bottom, 110)
            }
            .background(Color.white.ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .sidequestTopBar()
            .task {
                await reload()
            }
            .onDisappear { searchTask?.cancel() }
            .sheet(isPresented: $showingAddSheet) {
                AddSidequestSheet(
                    userId: session.userId,
                    viewModel: vm
                ) {
                    Task {
                        await reload()
                    }
                }
            }
        }
    }

    private var header: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 4) {
                Text("World")
                    .font(.system(size: 34, weight: .heavy))
                    .foregroundStyle(AppTheme.textPrimary)
                Text("Explore what's happening globally.")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(AppTheme.textSecondary)
            }

            Spacer()

            Button {
                showingAddSheet = true
            } label: {
                Image(systemName: "plus")
                    .font(.system(size: 21, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 48, height: 48)
                    .background(AppTheme.primary)
                    .clipShape(Circle())
            }
        }
    }

    private var searchBar: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(AppTheme.textSecondary)
            TextField("Search destination or activity", text: $vm.query)
                .textInputAutocapitalization(.words)
                .autocorrectionDisabled()
                .onChange(of: vm.query) { _, newValue in
                    queueSearch(for: newValue)
                }
                .onSubmit {
                    searchTask?.cancel()
                    Task {
                        await reload()
                    }
                }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 13)
        .background(Color(red: 0.95, green: 0.96, blue: 0.97))
        .clipShape(Capsule())
    }

    private var scopeSegment: some View {
        HStack(spacing: 0) {
            segmentButton(title: "Near You", value: "near")
            segmentButton(title: "Far Away", value: "far")
        }
        .padding(4)
        .background(Color(red: 0.95, green: 0.96, blue: 0.97))
        .clipShape(Capsule())
    }

    private func segmentButton(title: String, value: String) -> some View {
        Button {
            scope = value
            Task {
                await reload()
            }
        } label: {
            Text(title)
                .font(.subheadline.weight(.bold))
                .foregroundStyle(scope == value ? AppTheme.textPrimary : AppTheme.textSecondary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(scope == value ? Color.white : Color.clear)
                .clipShape(Capsule())
        }
    }

    private func sidequestCard(_ item: SidequestItem) -> some View {
        ZStack(alignment: .bottomLeading) {
            if let urlString = item.imageUrls.first, let url = URL(string: urlString) {
                AsyncImage(url: url) { phase in
                    if let image = phase.image {
                        image.resizable().scaledToFill()
                    } else {
                        cardFallback
                    }
                }
            } else {
                cardFallback
            }

            LinearGradient(
                colors: [Color.clear, Color.black.opacity(0.88)],
                startPoint: .top,
                endPoint: .bottom
            )

            VStack(alignment: .leading, spacing: 9) {
                HStack {
                    badge(icon: "location.fill", text: "\(String(format: "%.1f", item.distanceMiles)) mi")
                    Spacer()
                    badge(icon: "person.2.fill", text: "\(item.interestedCount) interested")
                }

                Spacer()
                Text(item.title)
                    .font(.title3.weight(.heavy))
                    .foregroundStyle(.white)
                    .lineLimit(2)

                Label(item.startsAt.formatted(date: .abbreviated, time: .shortened), systemImage: "calendar")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.white.opacity(0.85))
                Label("Hosted by \(item.hostName)", systemImage: "person")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.white.opacity(0.85))

                HStack(spacing: 10) {
                    Button {
                        Task { await vm.follow(hostUserId: item.hostUserId, followerId: session.userId) }
                    } label: {
                        Text("Follow")
                            .font(.subheadline.weight(.bold))
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    .tint(.white)

                    Button {
                        Task {
                            await vm.requestJoin(for: item, requesterId: session.userId, requesterName: session.displayName)
                            await reload()
                        }
                    } label: {
                        Text("Join")
                            .font(.subheadline.weight(.bold))
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(AppTheme.primary)
                }
            }
            .padding(16)
        }
        .frame(height: 284)
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
    }

    private func badge(icon: String, text: String) -> some View {
        HStack(spacing: 5) {
            Image(systemName: icon)
                .font(.caption2)
            Text(text)
                .font(.caption.weight(.bold))
        }
        .foregroundStyle(.white)
        .padding(.horizontal, 10)
        .padding(.vertical, 7)
        .background(Color.black.opacity(0.45))
        .clipShape(Capsule())
    }

    private var cardFallback: some View {
        LinearGradient(
            colors: [Color(red: 0.2, green: 0.35, blue: 0.58), Color(red: 0.1, green: 0.12, blue: 0.2)],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    private func queueSearch(for newValue: String) {
        let trimmed = newValue.trimmingCharacters(in: .whitespacesAndNewlines)
        searchTask?.cancel()
        guard !trimmed.isEmpty else { return }

        searchTask = Task {
            try? await Task.sleep(nanoseconds: 450_000_000)
            guard !Task.isCancelled else { return }
            await reload()
        }
    }

    @MainActor
    private func reload() async {
        await vm.load(scope: scope, query: vm.query)
        if let hostId = vm.items.first?.hostUserId { session.adoptKnownUser(hostId) }
    }
}

struct AddSidequestSheet: View {
    @Environment(\.dismiss) private var dismiss

    let userId: UUID
    @ObservedObject var viewModel: DiscoverViewModel
    var onCreated: () -> Void

    @State private var title = ""
    @State private var location = ""
    @State private var description = ""

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    formLabel("Title")
                    TextField("What's your sidequest?", text: $title)
                        .textInputAutocapitalization(.sentences)
                        .padding(12)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(AppTheme.border, lineWidth: 1))

                    formLabel("Location (optional)")
                    TextField("eg. Columbus", text: $location)
                        .padding(12)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(AppTheme.border, lineWidth: 1))

                    formLabel("Description")
                    TextField("Tell people what you're planning and how to join.", text: $description, axis: .vertical)
                        .lineLimit(4...8)
                        .padding(12)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(AppTheme.border, lineWidth: 1))

                    if let error = viewModel.errorMessage {
                        Text(error)
                            .font(.footnote.weight(.semibold))
                            .foregroundStyle(.red)
                    }

                    Button {
                        Task {
                            let ok = await viewModel.createSidequest(
                                userId: userId,
                                title: title.trimmingCharacters(in: .whitespacesAndNewlines),
                                description: description.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? "Personal sidequest" : description,
                                location: location
                            )
                            if ok {
                                onCreated()
                                dismiss()
                            }
                        }
                    } label: {
                        HStack {
                            if viewModel.isSubmitting {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Image(systemName: "checkmark")
                            }
                            Text(viewModel.isSubmitting ? "Saving..." : "Add Sidequest")
                                .fontWeight(.bold)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 13)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(AppTheme.primary)
                    .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || viewModel.isSubmitting)
                    .padding(.top, 8)
                }
                .padding(16)
            }
            .background(AppTheme.background.ignoresSafeArea())
            .navigationTitle("Add Sidequest")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
        }
    }

    private func formLabel(_ text: String) -> some View {
        Text(text)
            .font(.caption.weight(.bold))
            .foregroundStyle(AppTheme.textSecondary)
    }
}

struct WorldView_Previews: PreviewProvider {
    static var previews: some View {
        WorldView()
            .environmentObject(SessionStore())
    }
}
