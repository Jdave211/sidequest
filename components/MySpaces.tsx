import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Keyboard,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { BorderRadius, Colors, ComponentSizes, Shadows, Spacing, Typography } from '../constants/theme';
import { useSocialStore, useUserStore } from '../stores';
import { uploadImageToSupabase } from '../utils/imageUpload';
import SpaceCard from './SpaceCard';


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
  const [displayPicture, setDisplayPicture] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);

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
      
      await Sharing.shareAsync(message);
    } catch (error) {
      console.error('Error sharing space:', error);
      Alert.alert('Error', 'Failed to share space');
    }
  };

  const handleJoinCircle = async () => {
    const code = joinCode.trim().toUpperCase();
    
    // Client-side validation
    if (!code) {
      Alert.alert('Error', 'Please enter a circle code');
      return;
    }
    
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      Alert.alert('Error', 'Circle code must be exactly 6 characters (letters and numbers only)');
      return;
    }

    try {
      const joinedCircle = await joinCircle(code, authState.user?.id);
      setJoinCode('');
      setShowJoinForm(false);
      Alert.alert('Joined Space', `Welcome to "${joinedCircle.name}"!`);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to join circle');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setDisplayPicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeImage = () => {
    setDisplayPicture(undefined);
  };

  const handleCreateCircle = async () => {
    if (!circleName.trim()) {
      Alert.alert('Error', 'Please enter a circle name');
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload display picture if selected
      let displayPictureUrl: string | undefined;
      if (displayPicture) {
        try {
          const uploadResult = await uploadImageToSupabase(displayPicture, 'space-images');
          displayPictureUrl = uploadResult.url;
          console.log('[CreateSpace] Display picture uploaded:', displayPictureUrl);
        } catch (error) {
          console.error('[CreateSpace] Display picture upload failed:', error);
          Alert.alert('Warning', 'Failed to upload display picture, but space will be created without it.');
        }
      }

      const newCircle = await createCircle(
        circleName.trim(), 
        circleDescription.trim() || undefined, 
        displayPictureUrl
      );

      setCircleName('');
      setCircleDescription('');
      setDisplayPicture(undefined);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCircleCard = ({ item }: { item: any }) => (
    <SpaceCard
      item={item}
      isActive={currentCircle?.id === item.id}
      onPress={() => { setCurrentCircle(item); router.push(`/space/${item.id}` as any); }}
      onAddSidequest={() => { setCurrentCircle(item); router.push('/space/add-sidequest' as any); }}
    />
  );

  return (
    <Pressable
      style={styles.container}
      onPress={() => {
        if (searchExpanded) {
          setSearchExpanded(false);
          Keyboard.dismiss();
        }
      }}
    >
      {/* Header: centered search + balanced action pills */}
      <View style={styles.header}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Pressable
            style={[styles.searchBar, searchExpanded && styles.searchBarExpanded]}
            onPress={(e) => { e.stopPropagation(); setSearchExpanded(true); }}
          >
            <Ionicons name="search" size={20} color={Colors.textSecondary} />
            {searchExpanded ? (
              <TextInput
                style={styles.searchInput}
                placeholder="Search spaces"
                placeholderTextColor={Colors.textSecondary}
                autoFocus
                onBlur={() => setSearchExpanded(false)}
              />
            ) : (
              <Text style={styles.searchPlaceholder}>Search</Text>
            )}
          </Pressable>
        </View>

        {/* Balanced actions */}
        <View style={styles.headerActionsRow}>
          <TouchableOpacity
            style={[styles.headerPill, styles.headerPillLeft]}
            onPress={() => setShowJoinForm(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="enter-outline" size={18} color={Colors.textPrimary} />
            <Text style={styles.headerPillText}>Join Space</Text>
          </TouchableOpacity>
          <View style={styles.headerActionsSpacer} />
          <TouchableOpacity
            style={[styles.headerPill, styles.headerPillRight]}
            onPress={() => setShowCreateForm(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={18} color={Colors.textPrimary} />
            <Text style={styles.headerPillText}>Create Space</Text>
          </TouchableOpacity>
        </View>
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
            <RefreshControl 
              refreshing={isLoading} 
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              title={null}
            />
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
              Give your space a name, description, and optional display picture
            </Text>

            {/* Display Picture Section */}
            <View style={styles.imageContainer}>
              {displayPicture ? (
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: displayPicture }} style={styles.previewImage} />
                  <TouchableOpacity style={styles.removeImageBtn} onPress={removeImage}>
                    <Ionicons name="close-circle" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage}>
                  <Ionicons name="camera" size={32} color={Colors.textTertiary} />
                  <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>

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
                  setDisplayPicture(undefined);
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Let parent control background
  },
  header: {
    backgroundColor: Colors.white,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 25,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    ...Shadows.sm,
    width: 120,
    alignSelf: 'center',
  },
  searchBarExpanded: {
    width: '100%',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  searchPlaceholder: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  categoryTabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xl,
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  headerActionsSpacer: {
    flex: 1,
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexBasis: '48%',
    gap: Spacing.xs,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingVertical: Spacing.sm,
  },
  headerPillLeft: {
  },
  headerPillRight: {
  },
  headerPillText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  categoryTab: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: Colors.textPrimary,
  },
  categoryTabText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  activeTabText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.semibold,
  },
  listContent: {
    padding: Spacing.lg,
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
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.primary,
    ...Shadows.sm,
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
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
  imageContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  imageWrapper: {
    position: 'relative',
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.border,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.white,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.border,
    borderWidth: 2,
    borderColor: Colors.textTertiary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  imagePlaceholderText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textTertiary,
    fontWeight: Typography.fontWeight.medium,
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
