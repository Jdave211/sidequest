import SwiftUI

struct PlansView: View {
    @EnvironmentObject private var session: SessionStore
    @StateObject private var vm = DiscoverViewModel()
    @State private var showingAddSheet = false

    private var featured: SidequestItem? { vm.items.first }

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 18) {
                    header

                    sectionHeader("Upcoming Trips")

                    if let item = featured {
                        featuredCard(item)
                        HStack(spacing: 6) {
                            Image(systemName: "airplane")
                            Text("Happening Now")
                        }
                        .font(.headline.weight(.semibold))
                        .foregroundStyle(AppTheme.textSecondary)
                    } else {
                        emptyCard(title: "No trips yet", subtitle: "Create your first sidequest trip.")
                    }

                    sectionHeader("Columbus Groups 🇺🇸")
                    emptyCard(title: "It's quiet now...", subtitle: "Create the first group now 🎉", cta: "Add new group")

                    sectionHeader("Travelers Going")
                    emptyCard(title: "No one is going yet...", subtitle: "You'll be notified when someone joins the trip 💬")
                }
                .padding(.horizontal, 18)
                .padding(.top, 10)
                .padding(.bottom, 110)
            }
            .background(Color.white.ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .sidequestTopBar()
            .task {
                await vm.load(scope: "near")
                if let hostId = vm.items.first?.hostUserId { session.adoptKnownUser(hostId) }
            }
            .sheet(isPresented: $showingAddSheet) {
                AddSidequestSheet(userId: session.userId, viewModel: vm) {
                    Task {
                        await vm.load(scope: "near")
                        if let hostId = vm.items.first?.hostUserId { session.adoptKnownUser(hostId) }
                    }
                }
            }
        }
    }

    private var header: some View {
        HStack {
            Text("My Trips")
                .font(.system(size: 34, weight: .heavy))

            Spacer()

            Button {
                showingAddSheet = true
            } label: {
                Image(systemName: "plus")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 52, height: 52)
                    .background(AppTheme.primary)
                    .clipShape(Circle())
            }
        }
    }

    private func sectionHeader(_ title: String) -> some View {
        HStack {
            Text(title)
                .font(.title3.weight(.heavy))
            Spacer()
            Text("See All >")
                .font(.headline.weight(.bold))
                .foregroundStyle(AppTheme.primary)
        }
    }

    private func featuredCard(_ item: SidequestItem) -> some View {
        ZStack(alignment: .bottomLeading) {
            if let urlString = item.imageUrls.first, let url = URL(string: urlString) {
                AsyncImage(url: url) { phase in
                    if let image = phase.image {
                        image.resizable().scaledToFill()
                    } else {
                        LinearGradient(colors: [Color.gray.opacity(0.35), Color.black.opacity(0.4)], startPoint: .top, endPoint: .bottom)
                    }
                }
            } else {
                LinearGradient(colors: [Color.gray.opacity(0.35), Color.black.opacity(0.4)], startPoint: .top, endPoint: .bottom)
            }

            LinearGradient(colors: [Color.clear, Color.black.opacity(0.7)], startPoint: .top, endPoint: .bottom)

            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    HStack(spacing: 5) {
                        Text("🇺🇸")
                        Text(item.location ?? "Columbus")
                            .font(.title.weight(.heavy))
                    }
                    Spacer()
                    Text(item.startsAt.formatted(date: .abbreviated, time: .omitted).uppercased())
                        .font(.caption.weight(.heavy))
                        .opacity(0.9)
                }
                Spacer()
                HStack(spacing: -12) {
                    ForEach(0..<3, id: \.self) { idx in
                        Circle()
                            .fill(Color.white.opacity(0.85))
                            .frame(width: 36, height: 36)
                            .overlay(Text("\(idx + 1)").font(.caption.weight(.bold)))
                            .overlay(Circle().stroke(.white, lineWidth: 2))
                    }
                }
                Text(item.title)
                    .font(.headline.weight(.bold))
            }
            .foregroundStyle(.white)
            .padding(16)
        }
        .frame(height: 250)
        .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
    }

    private func emptyCard(title: String, subtitle: String, cta: String? = nil) -> some View {
        VStack(spacing: 10) {
            Text(title)
                .font(.title2.weight(.heavy))
            Text(subtitle)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(AppTheme.textSecondary)
                .multilineTextAlignment(.center)

            if let cta {
                Button(cta) {}
                    .font(.title3.weight(.bold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .foregroundStyle(AppTheme.primary)
                    .overlay(
                        Capsule().stroke(AppTheme.primary, lineWidth: 2)
                    )
            }
        }
        .padding(18)
        .frame(maxWidth: .infinity)
        .sidequestCardStyle(radius: 24)
    }
}

struct PlansView_Previews: PreviewProvider {
    static var previews: some View {
        PlansView()
            .environmentObject(SessionStore())
    }
}
