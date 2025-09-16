import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ActivityFeed from '../../components/ActivityFeed';
import MySpaces from '../../components/MySpaces';
import { Colors, ComponentSizes, Spacing, Typography } from '../../constants/theme';
import { useSocialStore, useUserStore } from '../../stores';

type SocialTab = 'spaces' | 'feed';

export default function Social() {
  const authState = useUserStore((state) => state.authState);
  const userCircles = useSocialStore((state) => state.userCircles);
  const loadActivityFeed = useSocialStore((state) => state.loadActivityFeed);
  const loadGlobalActivityFeed = useSocialStore((state) => state.loadGlobalActivityFeed);
  const loadUserCircles = useSocialStore((state) => state.loadUserCircles);
  
  const [activeTab, setActiveTab] = useState<SocialTab>('feed');

  // Load user circles when user changes
  useEffect(() => {
    if (authState.user) {
      loadUserCircles(authState.user.id);
    }
  }, [authState.user, loadUserCircles]);

  // Load global activity feed from all user's spaces
  useEffect(() => {
    if (authState.user) {
      const ids = userCircles.map(c => c.id);
      loadGlobalActivityFeed(ids);
    }
  }, [authState.user, userCircles, loadGlobalActivityFeed]);

  const onRefresh = () => {
    if (authState.user) {
      loadUserCircles(authState.user.id);
      const ids = userCircles.map(c => c.id);
      loadGlobalActivityFeed(ids);
    }
  };

  if (!authState.user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={ComponentSizes.icon.xlarge} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>Sign In Required</Text>
          <Text style={styles.emptyDescription}>
            Please sign in to access social features and join friend circles.
        </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, activeTab === 'spaces' && styles.spacesHeader]}>
        <Text style={[styles.headerTitle, activeTab === 'spaces' && styles.spacesHeaderTitle]}>
          {activeTab === 'feed' ? 'Activity' : 'Manage Spaces'}
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'feed' && styles.activeTab]}
          onPress={() => setActiveTab('feed')}
        >
          <Ionicons 
            name="pulse" 
            size={ComponentSizes.icon.medium} 
            color={activeTab === 'feed' ? Colors.primary : Colors.textSecondary} 
          />
          <Text style={[styles.tabText, activeTab === 'feed' && styles.activeTabText]}>
            Activity
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'spaces' && styles.activeTab]}
          onPress={() => setActiveTab('spaces')}
        >
          <Ionicons 
            name="home" 
            size={ComponentSizes.icon.medium} 
            color={activeTab === 'spaces' ? Colors.primary : Colors.textSecondary} 
          />
          <Text style={[styles.tabText, activeTab === 'spaces' && styles.activeTabText]}>
            Manage Spaces
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={[styles.contentContainer, activeTab === 'spaces' && styles.spacesBackground]}>
      {activeTab === 'spaces' ? (
          <MySpaces onRefresh={onRefresh} />
        ) : (
          <ActivityFeed onRefresh={onRefresh} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
  },
  contentContainer: {
    flex: 1,
  },
  spacesBackground: {
    backgroundColor: '#F8F9FA', // Light gray background for spaces
  },
  spacesHeader: {
    backgroundColor: 'black',
  },
  spacesHeaderTitle: {
    color: Colors.white,
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