import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BorderRadius, Colors, ComponentSizes, Shadows, Spacing, Typography } from '../constants/theme';
import { useSocialStore, useUserStore } from '../stores';

interface MySpacesProps {
  onRefresh: () => void;
}

export default function MySpaces({ onRefresh }: MySpacesProps) {
  const router = useRouter();
  const authState = useUserStore((state) => state.authState);
  const userCircles = useSocialStore((state) => state.userCircles);
  const currentCircle = useSocialStore((state) => state.currentCircle);
  const setCurrentCircle = useSocialStore((state) => state.setCurrentCircle);
  const isLoading = useSocialStore((state) => state.isLoading);
  const createCircle = useSocialStore((state) => state.createCircle);
  const joinCircle = useSocialStore((state) => state.joinCircle);
  const loadUserCircles = useSocialStore((state) => state.loadUserCircles);
  
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [circleName, setCircleName] = useState('');
  const [circleDescription, setCircleDescription] = useState('');

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

  const handleJoinCircle = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Error', 'Please enter a valid circle code');
      return;
    }

    try {
      const joinedCircle = await joinCircle(joinCode.trim(), authState.user?.id);
      setJoinCode('');
      setShowJoinForm(false);
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
    <View style={[styles.circleCard, currentCircle?.id === item.id && styles.circleCardActive]}>
      <TouchableOpacity
        style={styles.circleCardContent}
        onPress={() => { setCurrentCircle(item); router.push(`/space/${item.id}` as any); }}
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
        </View>
      </TouchableOpacity>
      
      {/* Space Actions */}
      <View style={styles.circleActions}>
        <TouchableOpacity 
          style={styles.circleActionButton}
          onPress={() => { setCurrentCircle(item); router.push('/space/add-sidequest' as any); }}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={ComponentSizes.icon.small} color={Colors.primary} />
          <Text style={styles.circleActionText}>Add</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.circleActionButton} 
          onPress={() => copyToClipboard(item.code, 'Invite code copied!')}
          activeOpacity={0.7}
        >
          <Ionicons name="copy-outline" size={ComponentSizes.icon.small} color={Colors.primary} />
          <Text style={styles.circleActionText}>Copy</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.circleActionButton} 
          onPress={() => shareSpace(item)}
          activeOpacity={0.7}
        >
          <Ionicons name="share-outline" size={ComponentSizes.icon.small} color={Colors.primary} />
          <Text style={styles.circleActionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Actions */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowJoinForm(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={ComponentSizes.icon.medium} color={Colors.primary} />
          <Text style={styles.headerButtonText}>Join Space</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowCreateForm(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={ComponentSizes.icon.medium} color={Colors.primary} />
          <Text style={styles.headerButtonText}>Create Space</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
    flex: 1,
    marginHorizontal: Spacing.sm,
    justifyContent: 'center',
  },
  headerButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
  },
  listContent: {
    padding: Spacing.lg,
  },
  circleCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  circleCardActive: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  circleCardContent: {
    padding: Spacing.lg,
  },
  circleActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  circleActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryLight,
  },
  circleActionText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
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
});
