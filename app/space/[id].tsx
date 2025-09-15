import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect } from 'react';
import {
    Alert,
    FlatList,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import SidequestCard from '../../components/SidequestCard';
import { BorderRadius, Colors, ComponentSizes, Spacing, Typography } from '../../constants/theme';
import { useSocialStore, useUserStore } from '../../stores';


export default function SpaceDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const spaceId = params.id as string;
  
  const authState = useUserStore((s) => s.authState);
  const userCircles = useSocialStore((s) => s.userCircles);
  const activityFeed = useSocialStore((s) => s.activityFeed);
  const circleMembers = useSocialStore((s) => s.circleMembers);
  const isLoading = useSocialStore((s) => s.isLoading);
  const loadActivityFeed = useSocialStore((s) => s.loadActivityFeed);
  const loadCircleMembers = useSocialStore((s) => s.loadCircleMembers);
  const leaveCircle = useSocialStore((s) => s.leaveCircle);
  const generateNewCode = useSocialStore((s) => s.generateNewCode);
  const loadUserCircles = useSocialStore((s) => s.loadUserCircles);

  const currentSpace = userCircles.find(c => c.id === spaceId);

  useEffect(() => {
    if (spaceId) {
      loadActivityFeed(spaceId);
      loadCircleMembers(spaceId);
    }
  }, [spaceId]);

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
        await Clipboard.setStringAsync(message);
        Alert.alert('Ready to Share!', 'The invite message has been copied to your clipboard. You can now paste it in any app to share with friends.');
      } else {
        await Clipboard.setStringAsync(message);
        Alert.alert('Copied!', 'Share message copied to clipboard. Paste it anywhere to invite friends!');
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share space invite');
    }
  };

  const handleLeaveSpace = async () => {
    if (!currentSpace || !authState.user) return;
    
    Alert.alert(
      'Leave Space',
      `Are you sure you want to leave "${currentSpace.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await leaveCircle(currentSpace.id, authState.user!.id);
              Alert.alert('Left Space', `You've left "${currentSpace.name}"`, [
                { text: 'OK', onPress: () => router.back() }
              ]);
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
    if (!currentSpace || !authState.user) return;
    
    Alert.alert(
      'Generate New Code',
      'This will invalidate the current invite code. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Generate', 
          onPress: async () => {
            try {
              const newCode = await generateNewCode(currentSpace.id, authState.user!.id);
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

  const renderActivityItem = ({ item }: { item: any }) => {
    return (
      <SidequestCard
        item={item}
        spaceName={currentSpace?.name || 'Space'}
      />
    );
  };

  const onRefresh = () => {
    if (spaceId) {
      loadActivityFeed(spaceId);
      loadCircleMembers(spaceId);
    }
  };

  if (!currentSpace) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={ComponentSizes.icon.xlarge} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>Space Not Found</Text>
          <Text style={styles.emptyDescription}>
            This space may have been deleted or you may not have access to it.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={ComponentSizes.icon.large} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{currentSpace.name}</Text>
          <Text style={styles.headerSubtitle}>Code: {currentSpace.code}</Text>
        </View>
        <TouchableOpacity onPress={handleLeaveSpace} style={styles.headerButton}>
          <Ionicons name="exit-outline" size={ComponentSizes.icon.large} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Space Actions Bar */}
      <View style={styles.actionsBar}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => copyToClipboard(currentSpace.code, 'Invite code copied!')}
          activeOpacity={0.7}
        >
          <Ionicons name="copy-outline" size={ComponentSizes.icon.small} color={Colors.primary} />
          <Text style={styles.actionText}>Copy Code</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => shareSpace(currentSpace)}
          activeOpacity={0.7}
        >
          <Ionicons name="share-outline" size={ComponentSizes.icon.small} color={Colors.primary} />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleGenerateNewCode}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={ComponentSizes.icon.small} color={Colors.primary} />
          <Text style={styles.actionText}>New Code</Text>
        </TouchableOpacity>
      </View>

      {/* Activity Feed */}
      {activityFeed.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={ComponentSizes.icon.xlarge} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Activity Yet</Text>
          <Text style={styles.emptyDescription}>
            Start creating sidequests in "{currentSpace.name}" to see activity here!
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

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/space/add-sidequest' as any)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={ComponentSizes.icon.large} color={Colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FF', // Light blue background to distinguish from activity feed
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.primary, // Blue header for space identity
  },
  headerButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white, // White text on blue header
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.white, // White text on blue header
    opacity: 0.8,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Semi-transparent white
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryLight,
  },
  actionText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
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
  backButton: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semibold,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
