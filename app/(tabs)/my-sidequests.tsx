import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Easing,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { LoadingCard } from '../../components/LoadingScreen';
import SidequestCard from '../../components/SidequestCard';
import { BorderRadius, Colors, ComponentSizes, Shadows, Spacing, Typography } from '../../constants/theme';
import { useSidequestStore, useUserStore } from '../../stores';

export default function MySidequests() {
  const sidequests = useSidequestStore((state) => state.sidequests);
  const isLoading = useSidequestStore((state) => state.isLoading);
  const loadUserSidequests = useSidequestStore((state) => state.loadUserSidequests);
  const deleteSidequest = useSidequestStore((state) => state.deleteSidequest);
  const authUser = useUserStore((state) => state.authState.user);
  const [searchQuery, setSearchQuery] = useState('');
  const listAnim = useRef(new Animated.Value(0)).current;

  // Initial list entrance animation
  useEffect(() => {
    Animated.timing(listAnim, {
      toValue: 1,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [listAnim]);

  // Load user's sidequests when user changes
  useEffect(() => {
    if (authUser?.id) {
      loadUserSidequests(authUser.id);
    }
  }, [authUser?.id, loadUserSidequests]);

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

  const filteredSidequests = useMemo(() => {
    if (!searchQuery.trim()) return sidequests;
    
    const query = searchQuery.toLowerCase();
    return sidequests.filter(sq => 
      sq.title.toLowerCase().includes(query) ||
      sq.description?.toLowerCase().includes(query) ||
      sq.category.toLowerCase().includes(query) ||
      sq.location?.toLowerCase().includes(query)
    );
  }, [sidequests, searchQuery]);

  // Data is preloaded in index.tsx, so we don't need to show loading here
  // Only show loading if there's an actual loading state and no data
  if (isLoading && sidequests.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {authUser?.displayName ? `${authUser.displayName}'s Sidequests` : 'My Sidequests'}
          </Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/settings' as any)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="settings-outline" size={ComponentSizes.icon.large} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <LoadingCard 
          message="Loading your sidequests..."
          height={400}
        />
      </SafeAreaView>
    );
  }

  // Debug logging
  console.log('[MySidequests] Debug info:', {
    sidequests: sidequests.length,
    isLoading,
    authUser: authUser?.id,
    filteredSidequests: filteredSidequests.length,
    sampleSidequest: sidequests[0]
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {authUser?.displayName ? `${authUser.displayName}'s Sidequests` : 'My Sidequests'}
        </Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push('/settings' as any)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="settings-outline" size={ComponentSizes.icon.large} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFillObject} />
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

      {/* Sidequests List with subtle entrance animation */}
      <Animated.View style={{
        opacity: listAnim,
        transform: [{ translateY: listAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
        flex: 1,
      }}>
        <FlatList
          data={filteredSidequests}
          renderItem={({ item }) => {
            console.log('[MySidequests] Rendering item:', item);
            return (
              <SidequestCard
                item={item}
                onPress={() => router.push(`/sidequest/${item.id}` as any)}
                onRemove={() => handleDelete(item.id, item.title)}
                showRemoveButton
              />
            );
          }}
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
      </Animated.View>

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
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  settingsButton: {
    padding: Spacing.sm,
  },
  searchContainer: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
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
    gap: Spacing.md,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.base,
  },
  listContainer: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    paddingBottom: 100,
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