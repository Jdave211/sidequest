import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { BorderRadius, Colors, Spacing, Typography } from '../../constants/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Mock data for discover sidequests (no functionality yet)
const MOCK_SIDEQUESTS = [
  {
    id: '1',
    title: 'Learn ice skating',
    location: 'Toronto, Canada',
    distance: '2 mi',
    category: 'sport',
    userImage: null,
  },
  {
    id: '2',
    title: 'Photography walk',
    location: 'Downtown, Canada',
    distance: '5 mi',
    category: 'creative',
    userImage: null,
  },
  {
    id: '3',
    title: 'Coffee tasting',
    location: 'Toronto, Canada',
    distance: '3 mi',
    category: 'food',
    userImage: null,
  },
];

const FILTER_TAGS = [
  { id: 'studying', icon: '📚', label: 'Studying Abroad' },
  { id: 'backpacking', icon: '🎒', label: 'Backpacking' },
  { id: 'adventure', icon: '🏔️', label: 'Adventure' },
  { id: 'food', icon: '🍜', label: 'Food' },
];

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState('Toronto, Canada');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const toggleFilter = (filterId: string) => {
    if (selectedFilters.includes(filterId)) {
      setSelectedFilters(selectedFilters.filter(f => f !== filterId));
    } else {
      setSelectedFilters([...selectedFilters, filterId]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search location"
              placeholderTextColor={Colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity>
              <Ionicons name="options-outline" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Filter Tags */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContainer}
          >
            {FILTER_TAGS.map((tag) => (
              <TouchableOpacity
                key={tag.id}
                style={[
                  styles.filterTag,
                  selectedFilters.includes(tag.id) && styles.filterTagActive,
                ]}
                onPress={() => toggleFilter(tag.id)}
              >
                <Text style={styles.filterIcon}>{tag.icon}</Text>
                <Text
                  style={[
                    styles.filterLabel,
                    selectedFilters.includes(tag.id) && styles.filterLabelActive,
                  ]}
                >
                  {tag.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* Map Area (Placeholder) */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          {/* Simulated map with pins */}
          <View style={styles.mapGrid}>
            {/* Mock pins scattered across the map */}
            <View style={[styles.pin, { top: '20%', left: '30%' }]}>
              <View style={styles.pinInner}>
                <View style={styles.pinDot} />
              </View>
            </View>
            <View style={[styles.pin, { top: '45%', left: '60%', transform: [{ scale: 1.2 }] }]}>
              <View style={[styles.pinInner, styles.pinInnerActive]}>
                <View style={[styles.pinDot, styles.pinDotActive]} />
              </View>
            </View>
            <View style={[styles.pin, { top: '35%', left: '20%' }]}>
              <View style={styles.pinInner}>
                <View style={styles.pinDot} />
              </View>
            </View>
            <View style={[styles.pin, { top: '60%', left: '75%' }]}>
              <View style={styles.pinInner}>
                <View style={styles.pinDot} />
              </View>
            </View>
            <View style={[styles.pin, { top: '25%', left: '80%' }]}>
              <View style={styles.pinInner}>
                <View style={styles.pinDot} />
              </View>
            </View>

            {/* Featured Sidequest Marker with label */}
            <View style={[styles.featuredMarker, { top: '45%', left: '50%' }]}>
              <View style={styles.markerBubble}>
                <Image
                  source={require('../../assets/images/sidequest_stock_images/ski1.png')}
                  style={styles.markerImage}
                />
                <Text style={styles.markerLabel} numberOfLines={1}>
                  Learn the ice skating
                </Text>
              </View>
            </View>
          </View>

          {/* Locate Me Button */}
          <TouchableOpacity style={styles.locateButton}>
            <Ionicons name="navigate" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          {/* Add Sidequest Button */}
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Sheet - Nearby Sidequests */}
      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{MOCK_SIDEQUESTS.length} Nearby Sidequests</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllButton}>See All →</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sidequestsContainer}
        >
          {MOCK_SIDEQUESTS.map((sidequest) => (
            <TouchableOpacity key={sidequest.id} style={styles.sidequestCard}>
              <View style={styles.sidequestImageContainer}>
                <Image
                  source={require('../../assets/images/sidequest_stock_images/ski1.png')}
                  style={styles.sidequestImage}
                  resizeMode="cover"
                />
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{sidequest.category}</Text>
                </View>
              </View>
              <View style={styles.sidequestInfo}>
                <Text style={styles.sidequestTitle} numberOfLines={1}>
                  {sidequest.title}
                </Text>
                <Text style={styles.sidequestLocation} numberOfLines={1}>
                  {sidequest.location}
                </Text>
                <View style={styles.sidequestMeta}>
                  <View style={styles.onlineIndicator} />
                  <Text style={styles.sidequestDistance}>{sidequest.distance}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* CTA Button */}
        <TouchableOpacity style={styles.ctaButton}>
          <Text style={styles.ctaButtonText}>See all {MOCK_SIDEQUESTS.length} Nearby Sidequests</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  filtersContainer: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTagActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterIcon: {
    fontSize: 16,
  },
  filterLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterLabelActive: {
    color: Colors.white,
  },
  mapContainer: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    position: 'relative',
  },
  mapGrid: {
    flex: 1,
    position: 'relative',
  },
  pin: {
    position: 'absolute',
  },
  pinInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    borderWidth: 3,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  pinInnerActive: {
    borderColor: Colors.primaryDark,
    borderWidth: 4,
  },
  pinDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  pinDotActive: {
    backgroundColor: Colors.primaryDark,
  },
  featuredMarker: {
    position: 'absolute',
    transform: [{ translateX: -60 }, { translateY: -70 }],
  },
  markerBubble: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 120,
  },
  markerImage: {
    width: 112,
    height: 80,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  markerLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  locateButton: {
    position: 'absolute',
    top: Spacing.xl,
    right: Spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    paddingTop: Spacing.md,
    paddingBottom: Spacing['2xl'],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 16,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.gray300,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  seeAllButton: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.primary,
  },
  sidequestsContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.md,
  },
  sidequestCard: {
    width: 180,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sidequestImageContainer: {
    position: 'relative',
  },
  sidequestImage: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.backgroundSecondary,
  },
  categoryBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  categoryBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.textPrimary,
    textTransform: 'capitalize',
  },
  sidequestInfo: {
    padding: Spacing.md,
  },
  sidequestTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  sidequestLocation: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  sidequestMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  sidequestDistance: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  ctaButton: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  ctaButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
});

