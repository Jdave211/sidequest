import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BorderRadius, Colors, ComponentSizes, Spacing, Typography } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { useSocialStore } from '../stores/socialStore';
import { useUserStore } from '../stores/userStore';
import SidequestCard from './SidequestCard';

interface SpaceDetailProps {
  spaceId: string;
  onBack: () => void;
}

export const SpaceDetail: React.FC<SpaceDetailProps> = ({ spaceId, onBack }) => {
  const router = useRouter();
  const { loadActivityFeed, loadUserCircles } = useSocialStore();
  const { authState } = useUserStore();
  
  const [currentSpace, setCurrentSpace] = useState<any>(null);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  
  // Modal states
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  
  // Members state
  const [circleMembers, setCircleMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  
  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    if (spaceId) {
      loadSpaceData();
    }
  }, [spaceId]);

  useEffect(() => {
    if (showMembersModal && spaceId) {
      loadMembers();
    }
  }, [showMembersModal, spaceId]);

  const loadSpaceData = async () => {
    if (!spaceId || !authState.user) return;
    
    setIsLoading(true);
    try {
      // Load space details
      const { data: spaceData, error: spaceError } = await supabase
        .from('friend_circles')
        .select('*')
        .eq('id', spaceId)
        .single();

      if (spaceError) throw spaceError;
      
      setCurrentSpace(spaceData);
      setIsOwner(spaceData.created_by === authState.user.id);
      
      // Load activity feed for this space
      await loadActivityFeed(spaceId);
      
      // Get the activity feed from the store
      const { activityFeed: feed } = useSocialStore.getState();
      setActivityFeed(feed);
      
    } catch (error) {
      console.error('Failed to load space data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMembers = async () => {
    if (!spaceId) return;
    
    console.log('Loading members for space:', spaceId);
    setLoadingMembers(true);
    try {
      const { data, error } = await supabase.rpc('get_circle_members', {
        circle_id_param: spaceId
      });
      
      if (error) {
        console.error('Members RPC error:', error);
        throw error;
      }
      
      console.log('Members loaded:', data);
      setCircleMembers(data || []);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleLeaveSpace = async () => {
    if (!currentSpace || !authState.user) return;
    
    try {
      const { error } = await supabase
        .from('circle_members')
        .delete()
        .eq('circle_id', currentSpace.id)
        .eq('user_id', authState.user.id);

      if (error) throw error;

      Alert.alert('Left Space', 'You have successfully left the space.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      
      // Reload user circles
      await loadUserCircles(authState.user.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to leave space. Please try again.');
    }
  };

  const handleShareLink = () => {
    const link = `sidequest://space/join?code=${currentSpace?.code}`;
    // You can implement sharing logic here
    Alert.alert('Share Link', `Copy this link: ${link}`);
  };

  const handleShareCode = () => {
    const code = currentSpace?.code;
    // You can implement sharing logic here
    Alert.alert('Share Code', `Share this code: ${code}`);
  };

  const handleEditSpace = () => {
    setEditName(currentSpace?.name || '');
    setEditDescription(currentSpace?.description || '');
    setShowEditModal(true);
  };

  const handleUpdateSpace = async () => {
    if (!currentSpace || !authState.user) return;
    
    try {
      const { error } = await supabase
        .from('friend_circles')
        .update({
          name: editName,
          description: editDescription,
        })
        .eq('id', currentSpace.id)
        .eq('created_by', authState.user.id);

      if (error) throw error;

      Alert.alert('Success', 'Space updated successfully!');
      setShowEditModal(false);
      
      // Reload space data
      await loadSpaceData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update space. Please try again.');
    }
  };

  const handleDeleteSpace = async () => {
    if (!currentSpace || !authState.user) return;
    
    try {
      const { error } = await supabase
        .from('friend_circles')
        .delete()
        .eq('id', currentSpace.id)
        .eq('created_by', authState.user.id);

      if (error) throw error;

      Alert.alert('Space Deleted', 'The space has been permanently deleted.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      
      // Reload user circles
      await loadUserCircles(authState.user.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete space. Please try again.');
    }
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
      loadSpaceData();
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
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Minimal Header - Just back button and space name */}
      <View style={styles.minimalHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={ComponentSizes.icon.large} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.spaceTitle}>{currentSpace.name}</Text>
        <TouchableOpacity onPress={() => {
          console.log('Opening options modal, current state:', showOptionsModal);
          setShowOptionsModal(true);
        }} style={styles.optionsButton}>
          <Ionicons name="ellipsis-horizontal" size={ComponentSizes.icon.large} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Activity Feed - Clean and focused */}
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
        onPress={() => router.push(`/space/add-sidequest?spaceId=${spaceId}`)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={ComponentSizes.icon.large} color={Colors.white} />
      </TouchableOpacity>

      {/* Options Modal */}
      <Modal visible={showOptionsModal} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowOptionsModal(false)}
        >
          <View style={styles.optionsModalWrapper}>
            <View style={styles.optionsModal}>
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={() => {
                  setShowOptionsModal(false);
                  setShowMembersModal(true);
                }}
              >
                <Ionicons name="people-outline" size={ComponentSizes.icon.medium} color={Colors.textPrimary} />
                <Text style={styles.optionText}>See Members</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.optionItem}
                onPress={() => {
                  setShowOptionsModal(false);
                  setShowShareModal(true);
                }}
              >
                <Ionicons name="share-outline" size={ComponentSizes.icon.medium} color={Colors.textPrimary} />
                <Text style={styles.optionText}>Share Space</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={() => {
                  setShowOptionsModal(false);
                  handleLeaveSpace();
                }}
              >
                <Ionicons name="exit-outline" size={ComponentSizes.icon.medium} color={Colors.textPrimary} />
                <Text style={styles.optionText}>Leave Space</Text>
              </TouchableOpacity>

              {isOwner && (
                <>
                  <TouchableOpacity 
                    style={styles.optionItem}
                    onPress={() => {
                      setShowOptionsModal(false);
                      setShowEditModal(true);
                    }}
                  >
                    <Ionicons name="create-outline" size={ComponentSizes.icon.medium} color={Colors.textPrimary} />
                    <Text style={styles.optionText}>Edit Space</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.optionItem, styles.dangerOption]}
                    onPress={() => {
                      setShowOptionsModal(false);
                      setShowDeleteModal(true);
                    }}
                  >
                    <Ionicons name="trash-outline" size={ComponentSizes.icon.medium} color={Colors.error} />
                    <Text style={[styles.optionText, styles.dangerText]}>Delete Space</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Share Modal */}
      <Modal visible={showShareModal} transparent animationType="slide">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowShareModal(false)}
        >
          <View style={styles.shareModal}>
            <Text style={styles.shareTitle}>Share Space</Text>
            <TouchableOpacity style={styles.shareOption} onPress={handleShareLink}>
              <Ionicons name="link-outline" size={ComponentSizes.icon.large} color={Colors.primary} />
              <Text style={styles.shareOptionText}>Share Link</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareOption} onPress={handleShareCode}>
              <Ionicons name="copy-outline" size={ComponentSizes.icon.large} color={Colors.primary} />
              <Text style={styles.shareOptionText}>Share Code</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowEditModal(false)}
        >
          <View style={styles.editModal}>
            <Text style={styles.editTitle}>Edit Space</Text>
            <TextInput
              style={styles.editInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Space name"
            />
            <TextInput
              style={[styles.editInput, styles.editTextArea]}
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Space description"
              multiline
              numberOfLines={3}
            />
            <View style={styles.editButtons}>
              <TouchableOpacity 
                style={[styles.editButton, styles.cancelButton]} 
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.editButton, styles.saveButton]} 
                onPress={handleUpdateSpace}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowDeleteModal(false)}
        >
          <View style={styles.deleteModal}>
            <Text style={styles.deleteTitle}>Delete Space</Text>
            <Text style={styles.deleteMessage}>
              Are you sure you want to delete "{currentSpace?.name}"? This action cannot be undone.
            </Text>
            <View style={styles.deleteButtons}>
              <TouchableOpacity 
                style={[styles.deleteButton, styles.cancelDeleteButton]} 
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelDeleteButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.deleteButton, styles.confirmDeleteButton]} 
                onPress={handleDeleteSpace}
              >
                <Text style={styles.confirmDeleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Members Modal */}
      <Modal visible={showMembersModal} transparent animationType="slide">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowMembersModal(false)}
        >
          <View style={styles.membersModal}>
            <Text style={styles.membersTitle}>Members</Text>
            {loadingMembers ? (
              <View style={styles.loadingContainer}>
                <Text>Loading members...</Text>
              </View>
            ) : circleMembers.length === 0 ? (
              <View style={styles.emptyMembers}>
                <Text>No members found</Text>
              </View>
            ) : (
              <FlatList
                data={circleMembers}
                keyExtractor={(item) => item.user_id}
                renderItem={({ item: member }) => (
                  <View style={styles.memberItem}>
                    <View style={styles.memberAvatar}>
                      {member.avatar_url ? (
                        <Image source={{ uri: member.avatar_url }} style={styles.memberAvatarImage} />
                      ) : (
                        <Text style={styles.memberInitials}>
                          {member.display_name?.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                      )}
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{member.display_name || 'Unknown'}</Text>
                      <Text style={styles.memberRole}>{member.role}</Text>
                    </View>
                    <View style={styles.memberBadges}>
                      {member.role === 'admin' && (
                        <Ionicons name="star" size={ComponentSizes.icon.small} color={Colors.warning} />
                      )}
                      {member.role === 'creator' && (
                        <Ionicons name="star" size={ComponentSizes.icon.small} color={Colors.primary} />
                      )}
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },
  minimalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
  },
  backButton: {
    padding: Spacing.sm,
  },
  spaceTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    flex: 1,
    textAlign: 'center',
  },
  optionsButton: {
    padding: Spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  backButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  listContent: {
    padding: Spacing.lg,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  optionsModalWrapper: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: Spacing.lg,
  },
  optionsModal: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    minWidth: 180,
    maxWidth: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  optionText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
  },
  dangerOption: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  dangerText: {
    color: Colors.error,
  },
  shareModal: {
    backgroundColor: Colors.white,
    margin: Spacing.xl,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  shareTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  shareOptionText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    marginLeft: Spacing.md,
  },
  editModal: {
    backgroundColor: Colors.white,
    margin: Spacing.xl,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  editTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  editInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.base,
    marginBottom: Spacing.md,
  },
  editTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
  },
  editButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.sm,
  },
  cancelButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    textAlign: 'center',
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    textAlign: 'center',
    fontSize: Typography.fontSize.base,
    color: Colors.white,
    fontWeight: Typography.fontWeight.medium,
  },
  deleteModal: {
    backgroundColor: Colors.white,
    margin: Spacing.xl,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  deleteTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.error,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  deleteMessage: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  deleteButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.sm,
  },
  cancelDeleteButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelDeleteButtonText: {
    textAlign: 'center',
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  confirmDeleteButton: {
    backgroundColor: Colors.error,
  },
  confirmDeleteButtonText: {
    textAlign: 'center',
    fontSize: Typography.fontSize.base,
    color: Colors.white,
    fontWeight: Typography.fontWeight.medium,
  },
  membersModal: {
    backgroundColor: Colors.white,
    margin: Spacing.xl,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    maxHeight: '70%',
    marginTop: 58,
  },
  membersTitle: {
    fontSize: Typography.fontSize.xlarge,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyMembers: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  memberAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  memberInitials: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  memberRole: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  memberBadges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
