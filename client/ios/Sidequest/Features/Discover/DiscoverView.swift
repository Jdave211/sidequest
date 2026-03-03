import MapKit
import SwiftUI

private struct MapPinItem: Identifiable {
    let id: UUID
    let sidequest: SidequestItem
    let coordinate: CLLocationCoordinate2D
}

struct DiscoverView: View {
    @EnvironmentObject private var session: SessionStore
    @StateObject private var vm = DiscoverViewModel()
    @State private var query = "Columbus, United States"
    @State private var selectedFilter = "learning"
    @State private var selectedId: UUID?

    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 39.9612, longitude: -82.9988),
        span: MKCoordinateSpan(latitudeDelta: 0.12, longitudeDelta: 0.12)
    )

    private let filters: [(id: String, title: String, icon: String)] = [
        ("all", "Filter", "slider.horizontal.3"),
        ("learning", "Studying Abroad", "book.fill"),
        ("adventure", "Backpacking", "backpack.fill"),
        ("creative", "Digital Nomad", "laptopcomputer")
    ]

    private var pinItems: [MapPinItem] {
        vm.items.enumerated().map { index, item in
            MapPinItem(
                id: item.id,
                sidequest: item,
                coordinate: coordinateFor(item: item, index: index)
            )
        }
    }

    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottom) {
                mapContent
                topOverlay
                bottomSheet
            }
            .background(AppTheme.background.ignoresSafeArea())
            .task {
                await vm.load(scope: "near", query: query)
                if let hostId = vm.items.first?.hostUserId { session.adoptKnownUser(hostId) }
            }
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .sidequestTopBar()
        }
    }

    private var mapContent: some View {
        Map(coordinateRegion: $region, annotationItems: pinItems) { pin in
            MapAnnotation(coordinate: pin.coordinate) {
                Button {
                    selectedId = pin.id
                } label: {
                    ZStack(alignment: .topTrailing) {
                        Circle()
                            .fill(.white)
                            .frame(width: selectedId == pin.id ? 68 : 58, height: selectedId == pin.id ? 68 : 58)
                            .shadow(color: .black.opacity(0.18), radius: 9, x: 0, y: 4)
                            .overlay(
                                Circle()
                                    .stroke(AppTheme.success, lineWidth: 3)
                                    .padding(3)
                            )
                            .overlay(
                                Text(String(pin.sidequest.hostName.prefix(1)).uppercased())
                                    .font(.title3.weight(.bold))
                                    .foregroundStyle(AppTheme.textPrimary)
                            )

                        Circle()
                            .fill(AppTheme.success)
                            .frame(width: 14, height: 14)
                            .overlay(Circle().stroke(.white, lineWidth: 2))
                    }
                }
            }
        }
        .mapStyle(.standard(elevation: .realistic))
        .ignoresSafeArea()
    }

    private var topOverlay: some View {
        VStack(spacing: 10) {
            HStack(spacing: 10) {
                Image(systemName: "magnifyingglass")
                    .foregroundStyle(AppTheme.textPrimary)
                TextField("Search city...", text: $query)
                    .font(.body.weight(.semibold))
                    .onSubmit {
                        Task {
                            await vm.load(scope: "near", query: query)
                            if let hostId = vm.items.first?.hostUserId { session.adoptKnownUser(hostId) }
                        }
                    }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 13)
            .background(.white)
            .clipShape(Capsule())
            .shadow(color: .black.opacity(0.08), radius: 12, x: 0, y: 4)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(filters, id: \.id) { filter in
                        Button {
                            selectedFilter = filter.id
                        } label: {
                            HStack(spacing: 6) {
                                Image(systemName: filter.icon)
                                Text(filter.title)
                            }
                            .font(.subheadline.weight(.bold))
                            .foregroundStyle(AppTheme.textPrimary)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 9)
                            .background(.white)
                            .overlay(
                                Capsule().stroke(selectedFilter == filter.id ? AppTheme.primary : .clear, lineWidth: 2)
                            )
                            .clipShape(Capsule())
                            .shadow(color: .black.opacity(0.05), radius: 6, x: 0, y: 2)
                        }
                    }
                }
                .padding(.horizontal, 4)
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 8)
        .frame(maxHeight: .infinity, alignment: .top)
    }

    private var bottomSheet: some View {
        VStack(spacing: 14) {
            Capsule()
                .fill(Color.gray.opacity(0.35))
                .frame(width: 46, height: 6)
                .padding(.top, 8)

            HStack {
                Text("\(vm.items.count) Nearby Travelers")
                    .font(.system(size: 22, weight: .heavy))
                Spacer()
                Text("See All >")
                    .font(.headline.weight(.bold))
                    .foregroundStyle(AppTheme.primary)
            }
            .padding(.horizontal, 20)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(vm.items.prefix(12)) { item in
                        travelerCard(item)
                    }
                }
                .padding(.horizontal, 18)
            }

            Button {
                Task {
                    await vm.load(scope: "near", query: query)
                    if let hostId = vm.items.first?.hostUserId { session.adoptKnownUser(hostId) }
                }
            } label: {
                Text("See all \(vm.items.count) Nearby Travelers")
                    .font(.title3.weight(.heavy))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .foregroundStyle(.white)
                    .background(LinearGradient(colors: [AppTheme.primaryLight, AppTheme.primary], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .clipShape(Capsule())
            }
            .padding(.horizontal, 18)
            .padding(.bottom, 14)
        }
        .background(AppTheme.background)
        .clipShape(RoundedRectangle(cornerRadius: 30, style: .continuous))
        .frame(height: 315)
    }

    private func travelerCard(_ item: SidequestItem) -> some View {
        ZStack(alignment: .bottomLeading) {
            if let urlString = item.imageUrls.first, let url = URL(string: urlString) {
                AsyncImage(url: url) { phase in
                    if let image = phase.image {
                        image.resizable().scaledToFill()
                    } else {
                        LinearGradient(colors: [Color.gray.opacity(0.35), Color.black.opacity(0.5)], startPoint: .top, endPoint: .bottom)
                    }
                }
            } else {
                LinearGradient(colors: [Color.gray.opacity(0.35), Color.black.opacity(0.5)], startPoint: .top, endPoint: .bottom)
            }
            LinearGradient(colors: [Color.clear, Color.black.opacity(0.9)], startPoint: .top, endPoint: .bottom)

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Text(item.hostName)
                        .font(.title3.weight(.heavy))
                    Circle()
                        .fill(AppTheme.success)
                        .frame(width: 12, height: 12)
                }
                Text("\(String(format: "%.0f", item.distanceMiles)) mi")
                    .font(.headline.weight(.semibold))
                    .opacity(0.95)
            }
            .foregroundStyle(.white)
            .padding(12)
        }
        .frame(width: 155, height: 195)
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
    }

    private func coordinateFor(item: SidequestItem, index: Int) -> CLLocationCoordinate2D {
        let seed = abs(item.id.uuidString.hashValue + index * 97)
        let latOffset = Double(seed % 80) / 1000.0 - 0.04
        let lonOffset = Double((seed / 80) % 80) / 1000.0 - 0.04
        return CLLocationCoordinate2D(
            latitude: 39.9612 + latOffset,
            longitude: -82.9988 + lonOffset
        )
    }
}

struct DiscoverView_Previews: PreviewProvider {
    static var previews: some View {
        DiscoverView()
            .environmentObject(SessionStore())
    }
}
