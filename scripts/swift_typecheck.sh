#!/usr/bin/env bash
set -euo pipefail

swiftc -typecheck \
  client/ios/Sidequest/App/SidequestApp.swift \
  client/ios/Sidequest/App/MainTabView.swift \
  client/ios/Sidequest/Design/AppTheme.swift \
  client/ios/Sidequest/Core/APIConfig.swift \
  client/ios/Sidequest/Core/APIClient.swift \
  client/ios/Sidequest/Models/SidequestItem.swift \
  client/ios/Sidequest/Features/Discover/DiscoverViewModel.swift \
  client/ios/Sidequest/Features/Discover/DiscoverView.swift \
  client/ios/Sidequest/Features/World/WorldView.swift \
  client/ios/Sidequest/Features/Plans/PlansView.swift \
  client/ios/Sidequest/Features/Chats/ChatsView.swift
