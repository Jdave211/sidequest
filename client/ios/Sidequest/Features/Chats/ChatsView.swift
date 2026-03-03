import SwiftUI

private enum ThreadFilter: String, CaseIterable {
    case all = "All"
    case dms = "DMs"
    case plans = "Plans"
}

private struct ThreadItem: Identifiable {
    let id: String
    let name: String
    let preview: String
    let time: String
    let unread: Int
    let filter: ThreadFilter
    let avatarColor: Color
}

struct ChatsView: View {
    @State private var activeFilter: ThreadFilter = .all

    private let rows: [ThreadItem] = [
        .init(id: "t1", name: "Andre", preview: "I posted indoor skydiving details in the plan.", time: "2m", unread: 2, filter: .dms, avatarColor: Color(red: 0.863, green: 0.91, blue: 0.98)),
        .init(id: "t2", name: "Skydiving Group", preview: "3 new join requests waiting for approval.", time: "9m", unread: 1, filter: .plans, avatarColor: Color(red: 0.98, green: 0.91, blue: 0.91)),
        .init(id: "t3", name: "Local Sidequest Crew", preview: "Who can host next Saturday?", time: "1h", unread: 0, filter: .plans, avatarColor: Color(red: 0.91, green: 0.98, blue: 0.92)),
        .init(id: "t4", name: "Maya", preview: "Can I follow your travel sidequests?", time: "3h", unread: 0, filter: .dms, avatarColor: Color(red: 0.98, green: 0.96, blue: 0.91))
    ]

    private var visibleRows: [ThreadItem] {
        if activeFilter == .all { return rows }
        return rows.filter { $0.filter == activeFilter }
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                header

                VStack(spacing: 18) {
                    segmentControl

                    ScrollView(showsIndicators: false) {
                        VStack(spacing: 14) {
                            ForEach(visibleRows) { row in
                                threadRow(row)
                            }
                        }
                        .padding(.horizontal, 4)
                        .padding(.bottom, 100)
                    }
                }
                .padding(.horizontal, 18)
                .padding(.top, 16)
                .background(
                    RoundedRectangle(cornerRadius: 32, style: .continuous)
                        .fill(AppTheme.panel)
                        .ignoresSafeArea(edges: .bottom)
                )
                .padding(.top, 12)
            }
            .background(Color.white.ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .sidequestTopBar()
        }
    }

    private var header: some View {
        HStack {
            HStack(spacing: 12) {
                Text("Chats")
                    .font(.system(size: 34, weight: .heavy))

                Text("0 Requests")
                    .font(.headline.weight(.bold))
                    .foregroundStyle(AppTheme.primary)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 7)
                    .background(AppTheme.primary.opacity(0.12))
                    .clipShape(Capsule())
            }

            Spacer()

            Image(systemName: "magnifyingglass")
                .font(.title2.weight(.semibold))
                .foregroundStyle(AppTheme.textPrimary)
        }
        .padding(.horizontal, 18)
        .padding(.top, 12)
    }

    private var segmentControl: some View {
        HStack(spacing: 0) {
            ForEach(ThreadFilter.allCases, id: \.rawValue) { filter in
                Button {
                    activeFilter = filter
                } label: {
                    Text(filter.rawValue)
                        .font(.title3.weight(.bold))
                        .foregroundStyle(activeFilter == filter ? AppTheme.textPrimary : AppTheme.textSecondary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(activeFilter == filter ? Color.white : Color.clear)
                        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
                }
            }
        }
        .padding(4)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
    }

    private func threadRow(_ row: ThreadItem) -> some View {
        HStack(spacing: 12) {
            Circle()
                .fill(row.avatarColor)
                .frame(width: 56, height: 56)
                .overlay(
                    Text(String(row.name.prefix(2)).uppercased())
                        .font(.headline.weight(.bold))
                        .foregroundStyle(AppTheme.textPrimary)
                )

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(row.name)
                        .font(.headline.weight(.bold))
                    Spacer()
                    Text(row.time)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(AppTheme.textSecondary)
                }
                Text(row.preview)
                    .font(.subheadline.weight(row.unread > 0 ? .semibold : .regular))
                    .foregroundStyle(row.unread > 0 ? AppTheme.textPrimary : AppTheme.textSecondary)
                    .lineLimit(1)
            }

            if row.unread > 0 {
                Circle()
                    .fill(AppTheme.primary)
                    .frame(width: 10, height: 10)
            }
        }
        .padding(8)
    }
}

struct ChatsView_Previews: PreviewProvider {
    static var previews: some View {
        ChatsView()
            .environmentObject(SessionStore())
    }
}
