import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { BorderRadius, Colors, ComponentSizes, Shadows, Spacing, Typography } from '../../constants/theme';
import { useSocialStore, useUserStore } from '../../stores';

type SocialTab = 'spaces' | 'feed';

export default function Social() {
  const router = useRouter();
  const authState = useUserStore((state) => state.authState);
  const userCircles = useSocialStore((state) => state.userCircles);
  const currentCircle = useSocialStore((state) => state.currentCircle);
  const setCurrentCircle = useSocialStore((state) => state.setCurrentCircle);
  const circleSidequests = useSocialStore((state) => state.circleSidequests);
  const circleMembers = useSocialStore((state) => state.circleMembers);
  const activityFeed = useSocialStore((state) => state.activityFeed);
  const isLoading = useSocialStore((state) => state.isLoading);
  const error = useSocialStore((state) => state.error);
  const createCircle = useSocialStore((state) => state.createCircle);
  const joinCircle = useSocialStore((state) => state.joinCircle);
  const leaveCircle = useSocialStore((state) => state.leaveCircle);
  const generateNewCode = useSocialStore((state) => state.generateNewCode);
  const loadCircleSidequests = useSocialStore((state) => state.loadCircleSidequests);
  const loadCircleMembers = useSocialStore((state) => state.loadCircleMembers);
  const loadActivityFeed = useSocialStore((state) => state.loadActivityFeed);
  const loadUserCircles = useSocialStore((state) => state.loadUserCircles);
  
  const [activeTab, setActiveTab] = useState<SocialTab>('spaces');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [circleName, setCircleName] = useState('');
  const [circleDescription, setCircleDescription] = useState('');

  // Load user circles when user changes
  useEffect(() => {
    if (authState.user) {
      loadUserCircles(authState.user.id);
    }
  }, [authState.user, loadUserCircles]);

  // Load data when current circle changes
  useEffect(() => {
    if (currentCircle) {
      loadCircleSidequests(currentCircle.id);
      loadCircleMembers(currentCircle.id);
      loadActivityFeed(currentCircle.id);
    }
  }, [currentCircle]);

  const copyToClipboard = async (text: string, message: string) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Copied!', message);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const shareSpace = async (circle: any) => {
    try {
      const shareUrl = `sidequest://space/join?code=${circle.code}`;
      const message = `Join my space "${circle.name}" on Sidequest!\n\nCode: ${circle.code}\nLink: ${shareUrl}`;
      
      if (await Sharing.isAvailableAsync()) {
        // Create a temporary text file to share
        await Clipboard.setStringAsync(message);
        Alert.alert('Ready to Share!', 'The invite message has been copied to your clipboard. You can now paste it in any app to share with friends.');
      } else {
        // Fallback to clipboard
        await Clipboard.setStringAsync(message);
        Alert.alert('Copied!', 'Share message copied to clipboard. Paste it anywhere to invite friends!');
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share space invite');
    }
  };

  const handleLeaveSpace = async () => {
    if (!currentCircle || !authState.user) return;
    
    Alert.alert(
      'Leave Space',
      `Are you sure you want to leave "${currentCircle.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await leaveCircle(currentCircle.id, authState.user!.id);
              Alert.alert('Left Space', `You've left "${currentCircle.name}"`);
              // Reload circles to update UI
              await loadUserCircles(authState.user!.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to leave space. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleGenerateNewCode = async () => {
    if (!currentCircle || !authState.user) return;
    
    Alert.alert(
      'Generate New Code',
      'This will invalidate the current invite code. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Generate', 
          onPress: async () => {
            try {
              const newCode = await generateNewCode(currentCircle.id, authState.user!.id);
              Alert.alert(
                'New Code Generated!', 
                `New invite code: ${newCode}`,
                [
                  { text: 'Copy', onPress: () => copyToClipboard(newCode, 'New code copied!') },
                  { text: 'OK' }
                ]
              );
            } catch (error) {
              Alert.alert('Error', 'Only the space creator can generate new codes.');
            }
          }
        }
      ]
    );
  };

  const handleJoinCircle = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Error', 'Please enter a valid circle code');
      return;
    }

    try {
      const joinedCircle = await joinCircle(joinCode.trim(), authState.user?.id);
      setJoinCode('');
      setShowJoinForm(false);
      setActiveTab('feed'); // Switch to activity feed to show the new space
      Alert.alert('Joined Space', `Welcome to "${joinedCircle.name}"!`);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to join circle');
    }
  };

  const handleCreateCircle = async () => {
    if (!circleName.trim()) {
      Alert.alert('Error', 'Please enter a circle name');
      return;
    }

    try {
      const newCircle = await createCircle(circleName.trim(), circleDescription.trim() || undefined, authState.user?.id);
      setCircleName('');
      setCircleDescription('');
      setShowCreateForm(false);
      Alert.alert(
        'Space Created', 
        `"${newCircle.name}" is ready!\n\nInvite code: ${newCircle.code}`,
        [
          { 
            text: 'Copy Code', 
            onPress: () => copyToClipboard(newCircle.code, 'Invite code copied!')
          },
          { 
            text: 'Share', 
            onPress: () => shareSpace(newCircle)
          },
          { text: 'Done' }
        ]
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create circle');
    }
  };

  const renderCircleCard = ({ item }: { item: any }) => (
    <TouchableOpacity
              style={[
        styles.circleCard,
        currentCircle?.id === item.id && styles.circleCardActive
      ]}
      onPress={() => setCurrentCircle(item)}
      activeOpacity={0.7}
    >
      <View style={styles.circleHeader}>
        <View style={styles.circleIcon}>
          <Ionicons name="people" size={ComponentSizes.icon.large} color={Colors.primary} />
        </View>
        <View style={styles.circleInfo}>
          <Text style={styles.circleName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.circleCode}>Code: {item.code}</Text>
          {item.description && (
            <Text style={styles.circleDescription} numberOfLines={2}>
              {item.description}
          </Text>
          )}
        </View>
      </View>
      <View style={styles.circleStats}>
        <View style={styles.statItem}>
          <Ionicons name="people-outline" size={ComponentSizes.icon.small} color={Colors.textSecondary} />
          <Text style={styles.statText}>{item.member_count || 0}</Text>
        </View>
        <Ionicons 
          name={currentCircle?.id === item.id ? "chevron-up" : "chevron-down"} 
          size={ComponentSizes.icon.medium} 
          color={Colors.textSecondary} 
        />
      </View>
    </TouchableOpacity>
  );

  const renderActivityItem = ({ item }: { item: any }) => (
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
              {new Date(item.created_at).toLocaleDateString()}
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

  const onRefresh = () => {
    if (currentCircle) {
      loadCircleSidequests(currentCircle.id);
      loadCircleMembers(currentCircle.id);
      loadActivityFeed(currentCircle.id);
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Spaces</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowJoinForm(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={ComponentSizes.icon.medium} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowCreateForm(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={ComponentSizes.icon.medium} color={Colors.primary} />
          </TouchableOpacity>
          {currentCircle && (
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: Colors.backgroundSecondary }]}
              onPress={handleLeaveSpace}
              activeOpacity={0.7}
            >
              <Ionicons name="exit-outline" size={ComponentSizes.icon.medium} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
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
            My Spaces
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'feed' && styles.activeTab]}
          onPress={() => setActiveTab('feed')}
          disabled={!currentCircle}
        >
          <Ionicons 
            name="pulse" 
            size={ComponentSizes.icon.medium} 
            color={activeTab === 'feed' && currentCircle ? Colors.primary : Colors.textSecondary} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === 'feed' && currentCircle && styles.activeTabText,
            !currentCircle && styles.tabTextDisabled
          ]}>
            Activity Feed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'spaces' ? (
        <View style={styles.content}>
          {userCircles.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={ComponentSizes.icon.xlarge} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>No Spaces Yet</Text>
              <Text style={styles.emptyDescription}>
                Create a new space or join one with a friend's code to get started!
              </Text>
              <View style={styles.emptyActions}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => setShowCreateForm(true)}
                >
                  <Text style={styles.primaryButtonText}>Create Space</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setShowJoinForm(true)}
                >
                  <Text style={styles.secondaryButtonText}>Join Space</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <FlatList
              data={userCircles}
              renderItem={renderCircleCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
              }
            />
          )}
        </View>
      ) : (
        <View style={styles.content}>
          {!currentCircle ? (
            <View style={styles.emptyState}>
              <Ionicons name="pulse-outline" size={ComponentSizes.icon.xlarge} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>Select a Space</Text>
              <Text style={styles.emptyDescription}>
                Choose a space from the "My Spaces" tab to view its activity feed.
              </Text>
            </View>
          ) : (
            <>
              {/* Current Space Info Bar */}
              <View style={styles.currentSpaceBar}>
                <View style={styles.currentSpaceInfo}>
                  <Text style={styles.currentSpaceName}>{currentCircle.name}</Text>
                  <Text style={styles.currentSpaceCode}>Code: {currentCircle.code}</Text>
                </View>
                <View style={styles.currentSpaceActions}>
                  <TouchableOpacity 
                    style={styles.spaceActionButton} 
                    onPress={() => copyToClipboard(currentCircle.code, 'Invite code copied!')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="copy-outline" size={ComponentSizes.icon.small} color={Colors.primary} />
                    <Text style={styles.spaceActionText}>Copy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.spaceActionButton} 
                    onPress={() => shareSpace(currentCircle)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="share-outline" size={ComponentSizes.icon.small} color={Colors.primary} />
                    <Text style={styles.spaceActionText}>Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.spaceActionButton} 
                    onPress={handleGenerateNewCode}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="refresh-outline" size={ComponentSizes.icon.small} color={Colors.primary} />
                    <Text style={styles.spaceActionText}>New Code</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {activityFeed.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="chatbubbles-outline" size={ComponentSizes.icon.xlarge} color={Colors.textSecondary} />
                  <Text style={styles.emptyTitle}>No Activity Yet</Text>
                  <Text style={styles.emptyDescription}>
                    Start creating sidequests in "{currentCircle.name}" to see activity here!
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
            </>
          )}
        </View>
      )}

      {/* Join Circle Modal */}
      {showJoinForm && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join a Space</Text>
            <Text style={styles.modalDescription}>
              Enter the 6-character code shared by your friend
            </Text>
            <TextInput
              style={styles.modalInput}
              value={joinCode}
              onChangeText={setJoinCode}
              placeholder="Enter code (e.g. ABC123)"
              placeholderTextColor={Colors.textTertiary}
              autoCapitalize="characters"
              maxLength={6}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  setShowJoinForm(false);
                  setJoinCode('');
                }}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
                  <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleJoinCircle}
              >
                <Text style={styles.primaryButtonText}>Join</Text>
                  </TouchableOpacity>
            </View>
          </View>
                </View>
      )}

      {/* Create Circle Modal */}
      {showCreateForm && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create a Space</Text>
            <Text style={styles.modalDescription}>
              Give your space a name and optional description
            </Text>
            <TextInput
              style={styles.modalInput}
              value={circleName}
              onChangeText={setCircleName}
              placeholder="Space name"
              placeholderTextColor={Colors.textTertiary}
              maxLength={50}
            />
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              value={circleDescription}
              onChangeText={setCircleDescription}
              placeholder="Description (optional)"
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  setShowCreateForm(false);
                  setCircleName('');
                  setCircleDescription('');
                }}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleCreateCircle}
              >
                <Text style={styles.primaryButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
            </View>
          </View>
        )}
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
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
    ...Shadows.sm,
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
  tabTextDisabled: {
    color: Colors.textTertiary,
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.lg,
  },
  circleCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  circleCardActive: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  circleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  circleIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  circleInfo: {
    flex: 1,
  },
  circleName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  circleCode: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  circleDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.base,
  },
  circleStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
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
  emptyActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  secondaryButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...Shadows.lg,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  modalDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.base,
    marginBottom: Spacing.lg,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  modalTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  currentSpaceBar: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentSpaceInfo: {
    flex: 1,
  },
  currentSpaceName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  currentSpaceCode: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  currentSpaceActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  spaceActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryLight,
  },
  spaceActionText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
  },
}); 