import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { Colors, ComponentSizes, Spacing, Typography } from '../constants/theme';
import { useSocialStore } from '../stores';
import SidequestCard from './SidequestCard';


interface ActivityFeedProps {
  onRefresh: () => void;
  searchQuery?: string;
}

export default function ActivityFeed({ onRefresh, searchQuery = '' }: ActivityFeedProps) {
  const userCircles = useSocialStore((state) => state.userCircles);
  const activityFeed = useSocialStore((state) => state.activityFeed);
  const isLoading = useSocialStore((state) => state.isLoading);

  // Filter activities based on search query
  const filteredActivities = activityFeed.filter(item => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const title = (item.sidequest?.title || '').toLowerCase();
    const review = (item.review || '').toLowerCase();
    const description = (item.description || '').toLowerCase();
    
    return title.includes(query) || review.includes(query) || description.includes(query);
  });

  const renderActivityItem = ({ item }: { item: any }) => {
    const spaceName = userCircles.find(c => 
      Array.isArray((c as any).sidequest_ids) && (c as any).sidequest_ids.includes(item.id)
    )?.name || 'Unknown Space';
    
    return (
      <SidequestCard
        item={item}
        spaceName={spaceName}
      />
    );
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
        data={filteredActivities}
          renderItem={renderActivityItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={isLoading} 
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              title={undefined}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  
  // Empty state
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
