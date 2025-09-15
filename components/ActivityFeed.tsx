import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BorderRadius, Colors, ComponentSizes, Shadows, Spacing, Typography } from '../constants/theme';
import { useSocialStore } from '../stores';

interface ActivityFeedProps {
  onRefresh: () => void;
}

export default function ActivityFeed({ onRefresh }: ActivityFeedProps) {
  const userCircles = useSocialStore((state) => state.userCircles);
  const activityFeed = useSocialStore((state) => state.activityFeed);
  const isLoading = useSocialStore((state) => state.isLoading);

  const renderActivityItem = ({ item }: { item: any }) => {
    const spaceName = userCircles.find(c => c.id === item.circle_id)?.name || 'Unknown Space';
    return (
      <View style={styles.activityCard}>
        <View style={styles.activityHeader}>
          <View style={styles.activityUser}>
            <View style={styles.activityAvatar}>
              <Ionicons name="person" size={ComponentSizes.icon.medium} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.activityUserName}>
                {item.user?.display_name || 'Unknown User'}
              </Text>
              <Text style={styles.activityTime}>
                {new Date(item.created_at).toLocaleDateString()} • {spaceName}
              </Text>
            </View>
          </View>
          <View style={[styles.activityTypeBadge, { backgroundColor: getActivityColor(item.activity_type) }]}>
            <Text style={styles.activityTypeText}>{item.activity_type}</Text>
          </View>
        </View>
        <Text style={styles.activityDescription}>
          {getActivityDescription(item)}
        </Text>
      </View>
    );
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'completed': return Colors.success;
      case 'started': return Colors.primary;
      case 'created': return Colors.info;
      default: return Colors.textSecondary;
    }
  };

  const getActivityDescription = (item: any) => {
    const sidequest = item.sidequest?.title || 'a sidequest';
    switch (item.activity_type) {
      case 'completed': return `Completed "${sidequest}"`;
      case 'started': return `Started working on "${sidequest}"`;
      case 'created': return `Created a new sidequest: "${sidequest}"`;
      default: return `Updated "${sidequest}"`;
    }
  };

  return (
    <View style={styles.container}>
      {activityFeed.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="pulse-outline" size={ComponentSizes.icon.xlarge} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Activity Yet</Text>
          <Text style={styles.emptyDescription}>
            Activity from all your spaces will appear here when members create or complete sidequests.
          </Text>
        </View>
      ) : (
        <FlatList
          data={activityFeed}
          renderItem={renderActivityItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.lg,
  },
  activityCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  activityUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  activityUserName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  activityTime: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  activityTypeBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  activityTypeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    textTransform: 'capitalize',
  },
  activityDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeight.base,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginVertical: Spacing.md,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.base,
    marginBottom: Spacing.xl,
  },
});
