import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BackgroundTextures, BorderRadius, Colors, ComponentSizes, getDifficultyColor, getStatusColor, Shadows, Spacing, Typography } from '../../constants/theme';
import { useSidequestStore } from '../../stores';
import { SidequestStatus } from '../../types/sidequest';

export default function MySidequests() {
  const sidequests = useSidequestStore((state) => state.sidequests);
  const updateSidequest = useSidequestStore((state) => state.updateSidequest);
  const deleteSidequest = useSidequestStore((state) => state.deleteSidequest);
  const [selectedStatus, setSelectedStatus] = useState<SidequestStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSidequests = useMemo(() => {
    let filtered = selectedStatus === 'ALL' 
      ? sidequests 
      : sidequests.filter(sq => sq.status === selectedStatus);
    
    if (searchQuery.trim()) {
      filtered = filtered.filter(sq => 
        sq.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sq.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sq.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [sidequests, selectedStatus, searchQuery]);

  const handleStatusUpdate = (id: string, newStatus: SidequestStatus) => {
    const updates: any = { status: newStatus };
    if (newStatus === SidequestStatus.COMPLETED) {
      updates.completedAt = new Date();
      updates.progress = 100;
    }
    updateSidequest(id, updates);
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      'Delete Sidequest',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => deleteSidequest(id)
        },
      ]
    );
  };

  const renderSidequest = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity
        style={styles.sidequestCard}
        onPress={() => router.push(`/sidequest/${item.id}` as any)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          {/* Standardized header */}
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <View style={styles.cardBadges}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
                </View>
                <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
                  <Text style={styles.difficultyText}>{item.difficulty}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => handleDelete(item.id, item.title)}
              style={styles.deleteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="heart-outline" size={ComponentSizes.icon.medium} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.cardDescription} numberOfLines={3}>
            {item.description}
          </Text>
          
          {/* Standardized meta information */}
          <View style={styles.cardMeta}>
            <View style={styles.metaChip}>
              <Ionicons name="folder-outline" size={ComponentSizes.icon.small} color={Colors.primary} />
              <Text style={styles.metaText}>{item.category}</Text>
            </View>
            <View style={styles.metaChip}>
              <Ionicons name="time-outline" size={ComponentSizes.icon.small} color={Colors.primary} />
              <Text style={styles.metaText}>{item.estimatedTime}</Text>
            </View>
          </View>

          {/* Standardized progress display */}
          {item.progress !== undefined && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{item.progress}%</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const statusOptions = [
    { label: 'All', value: 'ALL' as const },
    { label: 'Active', value: SidequestStatus.IN_PROGRESS },
    { label: 'Done', value: SidequestStatus.COMPLETED },
    { label: 'Paused', value: SidequestStatus.PAUSED },
    { label: 'New', value: SidequestStatus.NOT_STARTED },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed header with search */}
      <View style={styles.fixedHeader}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={ComponentSizes.icon.medium} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search your sidequests..."
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={ComponentSizes.icon.medium} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPills}
          >
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterPill,
                  selectedStatus === option.value && styles.filterPillActive,
                ]}
                onPress={() => setSelectedStatus(option.value)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    selectedStatus === option.value && styles.filterPillTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Sidequests List */}
      <FlatList
        data={filteredSidequests}
        renderItem={renderSidequest}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="compass-outline" size={ComponentSizes.icon.xlarge * 2} color={Colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No sidequests found' : 'No sidequests yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery 
                ? `Try adjusting your search for "${searchQuery}"`
                : 'Ready to start your first adventure? Tap the + button below!'
              }
            </Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/add-sidequest' as any)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={ComponentSizes.icon.large} color={Colors.textInverse} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Add subtle texture
    ...BackgroundTextures.paper,
  },
  fixedHeader: {
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingTop: Spacing.md,
    ...Shadows.sm,
  },
  searchContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
    gap: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  filterContainer: {
    paddingBottom: Spacing.lg,
  },
  filterPills: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  filterPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterPillText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
  },
  filterPillTextActive: {
    color: Colors.textInverse,
  },
  listContainer: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    paddingBottom: 100,
  },
  sidequestCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardContent: {
    // Card content uses the padding from the card
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeight.lg,
  },
  cardBadges: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'capitalize',
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  difficultyText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  cardDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.base,
    marginBottom: Spacing.lg,
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primaryLight + '15',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  metaText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  progressBar: {
    flex: 1,
    height: Spacing.xs,
    backgroundColor: Colors.gray200,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.bold,
    minWidth: 35,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['6xl'],
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.base,
  },
  fab: {
    position: 'absolute',
    bottom: 34,
    right: Spacing.xl,
    width: ComponentSizes.fab.size,
    height: ComponentSizes.fab.size,
    borderRadius: ComponentSizes.fab.borderRadius,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },
}); 