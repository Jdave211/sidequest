import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackgroundTextures, BorderRadius, Colors, ComponentSizes, getDifficultyColor, getStatusColor, Shadows, Spacing, Typography } from '../../constants/theme';
import { useSidequestStore, useUserStore } from '../../stores';
import { SidequestStatus } from '../../types/sidequest';

export default function MySidequests() {
  const sidequests = useSidequestStore((state) => state.sidequests);
  const isLoading = useSidequestStore((state) => state.isLoading);
  const loadUserSidequests = useSidequestStore((state) => state.loadUserSidequests);
  const updateSidequest = useSidequestStore((state) => state.updateSidequest);
  const deleteSidequest = useSidequestStore((state) => state.deleteSidequest);
  const signOut = useUserStore((state) => state.signOut);
  const authUser = useUserStore((state) => state.authState.user);
  const updateUserProfile = useUserStore((state) => state.updateProfile);
  const [selectedStatus, setSelectedStatus] = useState<SidequestStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [themePref, setThemePref] = useState<'system' | 'light' | 'dark'>('system');
  const [settingsQuery, setSettingsQuery] = useState('');
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Modal width (center popup)
  const modalWidth = useMemo(() => {
    const target = screenWidth * 0.9;
    const min = 320;
    const max = 640;
    return Math.max(min, Math.min(max, target));
  }, [screenWidth]);

  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const stored = await AsyncStorage.getItem('theme_preference');
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setThemePref(stored);
        }
      } catch {}
    };
    loadPrefs();
  }, []);

  // Load user's sidequests when user changes
  useEffect(() => {
    if (authUser?.id) {
      loadUserSidequests(authUser.id);
    }
  }, [authUser?.id, loadUserSidequests]);

  const openSettings = () => {
    setDisplayNameInput(authUser?.displayName || '');
    setIsSettingsOpen(true);
  };

  const saveDisplayName = async () => {
    if (!displayNameInput.trim()) {
      Alert.alert('Validation', 'Display name cannot be empty.');
      return;
    }
    try {
      setIsSavingProfile(true);
      await updateUserProfile({ displayName: displayNameInput.trim() });
      Alert.alert('Success', 'Profile updated.');
    } catch (e) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const setTheme = async (pref: 'system' | 'light' | 'dark') => {
    try {
      setThemePref(pref);
      await AsyncStorage.setItem('theme_preference', pref);
      // Note: Hook up actual theme switching in app-wide provider later.
    } catch {}
  };

  const handleSignOut = async () => {
    await signOut();
    setIsSettingsOpen(false);
    router.replace('/welcome');
  };

  const goEditProfile = () => {
    setIsSettingsOpen(false);
    router.push('/profile-setup' as any);
  };

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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/space/add-sidequest', params: { title: item.title } } as any)}
                style={styles.deleteButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="add-circle-outline" size={ComponentSizes.icon.medium} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(item.id, item.title)}
                style={styles.deleteButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="trash-outline" size={ComponentSizes.icon.medium} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
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
      {/* Settings Header Row */}
      <View style={styles.settingsRow}>
        <Text style={styles.settingsTitle}>
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

      {/* Settings Sidebar Overlay */}
      {isSettingsOpen && (
        <View style={styles.overlayContainer}>
          <TouchableOpacity style={styles.overlayBackdrop} onPress={() => setIsSettingsOpen(false)} />
          <View style={[styles.modalCard, { width: modalWidth, maxWidth: modalWidth, paddingTop: insets.top + Spacing.lg }]}> 
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.backButton} onPress={() => setIsSettingsOpen(false)} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
                <Ionicons name="chevron-back" size={ComponentSizes.icon.large} color={Colors.textPrimary} />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Settings</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Handle */}
            {!!authUser && (
              <Text style={styles.handleText}>
                @{authUser.displayName || authUser.email?.split('@')[0]}
              </Text>
            )}

            {/* Search */}
            <View style={styles.sidebarSearchBar}>
              <Ionicons name="search" size={ComponentSizes.icon.medium} color={Colors.textSecondary} />
              <TextInput
                style={styles.sidebarSearchInput}
                placeholder="Search settings"
                placeholderTextColor={Colors.textSecondary}
                value={settingsQuery}
                onChangeText={setSettingsQuery}
              />
            </View>

            {/* Sections */}
            <Text style={styles.sectionHeader}>Your account</Text>
            <TouchableOpacity style={styles.row} onPress={goEditProfile} activeOpacity={0.7}>
              <View style={styles.rowIcon}><Ionicons name="person-outline" size={ComponentSizes.icon.medium} color={Colors.textSecondary} /></View>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>Edit profile</Text>
                <Text style={styles.rowSubtitle}>Update your display name</Text>
              </View>
              <Ionicons name="chevron-forward" size={ComponentSizes.icon.medium} color={Colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.separator} />

            <Text style={styles.sectionHeader}>Security and account access</Text>
            <TouchableOpacity style={styles.row} onPress={handleSignOut} activeOpacity={0.7}>
              <View style={styles.rowIcon}><Ionicons name="log-out-outline" size={ComponentSizes.icon.medium} color={Colors.textSecondary} /></View>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>Sign out</Text>
                <Text style={styles.rowSubtitle}>Sign out of your account on this device</Text>
              </View>
              <Ionicons name="chevron-forward" size={ComponentSizes.icon.medium} color={Colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity style={styles.row} onPress={() => Alert.alert('Coming soon', 'Delete account will be available soon.')} activeOpacity={0.7}>
              <View style={styles.rowIcon}><Ionicons name="trash-outline" size={ComponentSizes.icon.medium} color={Colors.textSecondary} /></View>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>Delete account</Text>
                <Text style={styles.rowSubtitle}>Permanently delete your account (coming soon)</Text>
              </View>
              <Ionicons name="chevron-forward" size={ComponentSizes.icon.medium} color={Colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.separator} />

            <Text style={styles.sectionHeader}>Appearance</Text>
            {(['system','light','dark'] as const).map((opt) => (
              <React.Fragment key={opt}>
                <TouchableOpacity style={styles.row} onPress={() => setTheme(opt)} activeOpacity={0.7}>
                  <View style={styles.rowIcon}>
                    <Ionicons
                      name={opt === 'system' ? 'phone-portrait-outline' : opt === 'light' ? 'sunny-outline' : 'moon-outline'}
                      size={ComponentSizes.icon.medium}
                      color={Colors.textSecondary}
                    />
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={styles.rowTitle}>{opt === 'system' ? 'Use system theme' : opt === 'light' ? 'Light mode' : 'Dark mode'}</Text>
                    {themePref === opt ? <Text style={styles.rowSubtitle}>Selected</Text> : null}
                  </View>
                  <Ionicons name="chevron-forward" size={ComponentSizes.icon.medium} color={Colors.textSecondary} />
                </TouchableOpacity>
                <View style={styles.separator} />
              </React.Fragment>
            ))}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Add subtle texture
    ...BackgroundTextures.paper,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  settingsTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  settingsButton: {
    padding: Spacing.sm,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  overlayBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sidebar: {
    width: '80%',
    backgroundColor: Colors.surface,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    padding: Spacing.xl,
    ...Shadows.lg,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  handleText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.md,
    paddingHorizontal: 2,
  },
  sidebarSearchBar: {
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
    marginBottom: Spacing.md,
  },
  sidebarSearchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.base,
  },
  sectionHeader: {
    paddingVertical: Spacing.md,
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
  },
  rowIcon: {
    width: 28,
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  rowSubtitle: {
    color: Colors.textSecondary,
    marginTop: 4,
    fontSize: Typography.fontSize.sm,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
  },
  sidebarTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  inputGroup: {
    gap: Spacing.sm,
  },
  inputLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.textPrimary,
  },
  rowBtns: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  primaryBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  primaryBtnText: {
    color: Colors.textInverse,
    fontWeight: Typography.fontWeight.semibold,
  },
  secondaryBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
  },
  secondaryBtnText: {
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.semibold,
  },
  dangerBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: '#ef4444',
    borderRadius: BorderRadius.md,
  },
  dangerBtnText: {
    color: Colors.textInverse,
    fontWeight: Typography.fontWeight.semibold,
  },
  themeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  themeChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
  },
  themeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  themeChipText: {
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.semibold,
  },
  themeChipTextActive: {
    color: Colors.textInverse,
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
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.base,
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
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    margin: Spacing.lg,
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  backText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
}); 