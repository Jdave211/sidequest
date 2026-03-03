import SwiftUI

enum AppTheme {
    static let primary = Color(red: 0.0, green: 0.478, blue: 1.0)
    static let primaryLight = Color(red: 0.353, green: 0.784, blue: 0.98)
    static let background = Color(red: 0.949, green: 0.949, blue: 0.969)
    static let panel = Color(red: 0.975, green: 0.98, blue: 0.992)
    static let card = Color.white
    static let textPrimary = Color.black
    static let textSecondary = Color(red: 0.42, green: 0.45, blue: 0.5)
    static let border = Color(red: 0.898, green: 0.906, blue: 0.922)
    static let success = Color(red: 0.204, green: 0.78, blue: 0.349)
}

extension View {
    func sidequestCardStyle(radius: CGFloat = 22) -> some View {
        self
            .background(AppTheme.card)
            .clipShape(RoundedRectangle(cornerRadius: radius, style: .continuous))
            .shadow(color: .black.opacity(0.05), radius: 10, x: 0, y: 4)
    }
}
