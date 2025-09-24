import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ActivityFeed from '../../components/ActivityFeed';
import MySpaces from '../../components/MySpaces';
import QuoteScreen from '../../components/QuoteScreen';
import { Colors, ComponentSizes, Spacing, Typography } from '../../constants/theme';
import { useSocialStore, useUserStore } from '../../stores';

type SocialTab = 'spaces' | 'feed';

const { width: screenWidth } = Dimensions.get('window');

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('for you');

  const categories = ['for you', 'adventure', 'creative', 'fitness', 'learning', 'social'];

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

  const renderModernHeader = () => (
    <View style={styles.modernHeader}>
      <LinearGradient
        colors={['#8B9DC3', '#A8B5D1', '#C5D2E8']}
        style={styles.headerGradient}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            {/* Profile and Logo */}
            <View style={styles.headerTop}>
              <View style={styles.logoSection}>
                <View style={styles.logoContainer}>
                  <Ionicons name="diamond" size={24} color="#fff" />
      </View>
                <Text style={styles.appName}>Sidequest</Text>
              </View>
              <TouchableOpacity style={styles.profileButton}>
                <View style={styles.profileImage}>
                  <Text style={styles.profileInitial}>
                    {authState.user?.displayName?.charAt(0) || 'U'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchSection}>
              <BlurView intensity={20} tint="light" style={styles.searchBlur}>
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={20} color="#666" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder={activeTab === 'spaces' ? 'Search spaces' : 'Search activities'}
                    placeholderTextColor="#999"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
        </View>
              </BlurView>
            </View>

            {/* Category Filters */}
            {activeTab === 'spaces' && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesContainer}
              >
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryChip,
                      selectedCategory === category && styles.categoryChipActive
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text style={[
                      styles.categoryText,
                      selectedCategory === category && styles.categoryTextActive
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Tab Navigation */}
            <View style={styles.modernTabContainer}>
              <TouchableOpacity
                style={[styles.modernTab, activeTab === 'feed' && styles.modernTabActive]}
                onPress={() => setActiveTab('feed')}
              >
                <Ionicons 
                  name="pulse" 
                  size={18} 
                  color={activeTab === 'feed' ? '#667eea' : '#fff'} 
                />
                <Text style={[styles.modernTabText, activeTab === 'feed' && styles.modernTabTextActive]}>
                  Activity
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modernTab, activeTab === 'spaces' && styles.modernTabActive]}
                onPress={() => setActiveTab('spaces')}
              >
                <Ionicons 
                  name="grid" 
                  size={18} 
                  color={activeTab === 'spaces' ? '#667eea' : '#fff'} 
                />
                <Text style={[styles.modernTabText, activeTab === 'spaces' && styles.modernTabTextActive]}>
                  Spaces
                </Text>
              </TouchableOpacity>
            </View>
            </View>
        </SafeAreaView>
      </LinearGradient>
          </View>
  );

  return (
    <View style={styles.container}>
      {renderModernHeader()}
      
      {/* Content */}
      <View style={styles.contentContainer}>
        {activeTab === 'spaces' ? (
          <MySpaces onRefresh={onRefreshSpaces} searchQuery={searchQuery} selectedCategory={selectedCategory} />
        ) : (
          <ActivityFeed onRefresh={onRefreshFeed} searchQuery={searchQuery} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modernHeader: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  headerGradient: {
    paddingBottom: 16,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
  },
  profileButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  profileInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  searchSection: {
    marginBottom: 16,
  },
  searchBlur: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  categoriesContainer: {
    paddingVertical: 8,
    gap: 12,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  categoryChipActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  categoryTextActive: {
    color: '#667eea',
  },
  modernTabContainer: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25,
    padding: 4,
  },
  modernTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 21,
  },
  modernTabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  modernTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  modernTabTextActive: {
    color: '#667eea',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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