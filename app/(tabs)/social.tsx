import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
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
import QuoteScreen from '../../components/QuoteScreen';
import { Colors, ComponentSizes, Spacing, Typography } from '../../constants/theme';
import { useSocialStore, useUserStore } from '../../stores';

type SocialTab = 'spaces' | 'feed';

export default function Social() {
  const authState = useUserStore((state) => state.authState);
  const userCircles = useSocialStore((state) => state.userCircles);
  const isLoading = useSocialStore((state) => state.isLoading);
  const loadActivityFeed = useSocialStore((state) => state.loadActivityFeed);
  const loadGlobalActivityFeed = useSocialStore((state) => state.loadGlobalActivityFeed);
  const loadUserCircles = useSocialStore((state) => state.loadUserCircles);
  const setLoading = useSocialStore((state) => state.setLoading);
  
  const { showQuotes } = useLocalSearchParams<{ showQuotes?: string }>();
  const [activeTab, setActiveTab] = useState<SocialTab>('feed');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showQuoteScreen, setShowQuoteScreen] = useState(showQuotes === 'true');
  const [dataPreloaded, setDataPreloaded] = useState(false);

  // Load circles and activity feed after sign-in (quote overlay is purely visual)
  useEffect(() => {
    if (authState.user) {
      const loadData = async () => {
        try {
          setLoading(true);
          await loadUserCircles(authState.user?.id || '');
          const circles = useSocialStore.getState().userCircles;
          if (circles.length > 0) {
            await loadGlobalActivityFeed(circles.map(c => c.id));
          }
          setDataPreloaded(true);
        } catch (error) {
          console.error('Error loading data:', error);
          setDataPreloaded(true);
        } finally {
          setLoading(false);
        }
      };
      loadData();
      setIsInitialLoad(false);
    }
  }, [authState.user, loadUserCircles, loadGlobalActivityFeed]);

  const onRefreshFeed = () => {
    if (authState.user) {
      const ids = userCircles.map(c => c.id);
      loadGlobalActivityFeed(ids);
    }
  };

  const onRefreshSpaces = () => {
    if (authState.user) {
      loadUserCircles(authState.user.id);
    }
  };

  // When tab switches to 'feed', ensure we load the global feed (not last opened space)
  React.useEffect(() => {
    if (authState.user && activeTab === 'feed') {
      const ids = userCircles.map(c => c.id);
      (async () => {
        try {
          setLoading(true);
          await loadGlobalActivityFeed(ids);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [activeTab, authState.user, userCircles, loadGlobalActivityFeed]);

  // Also refresh global feed whenever this screen regains focus
  useFocusEffect(
    React.useCallback(() => {
      if (authState.user && activeTab === 'feed') {
        const ids = useSocialStore.getState().userCircles.map(c => c.id);
        (async () => {
          try {
            setLoading(true);
            await loadGlobalActivityFeed(ids);
          } finally {
            setLoading(false);
          }
        })();
      }
      return () => {};
    }, [authState.user, activeTab, loadGlobalActivityFeed])
  );

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

  // Show quote screen while loading data after sign-in
  if (showQuoteScreen && !dataPreloaded) {
    return (
      <QuoteScreen
        onComplete={() => setShowQuoteScreen(false)}
        duration={2500}
      />
    );
  }

  // Remove full-screen loading state

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
          <MySpaces onRefresh={onRefreshSpaces} />
        ) : (
          <ActivityFeed onRefresh={onRefreshFeed} />
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