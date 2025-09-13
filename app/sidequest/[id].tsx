import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { BorderRadius, Colors, Components, ComponentSizes, getDifficultyColor, getStatusColor, Shadows, Spacing, Typography } from '../../constants/theme';
import { useSidequestStore } from '../../stores';
import { SidequestStatus } from '../../types/sidequest';

export default function SidequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const getSidequestById = useSidequestStore((state) => state.getSidequestById);
  const updateSidequest = useSidequestStore((state) => state.updateSidequest);
  const deleteSidequest = useSidequestStore((state) => state.deleteSidequest);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [isEditingProgress, setIsEditingProgress] = useState(false);
  const [editedProgress, setEditedProgress] = useState('');

  const sidequest = getSidequestById(id);

  if (!sidequest) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle-outline" size={ComponentSizes.icon.xlarge * 2} color={Colors.textTertiary} />
          </View>
          <Text style={styles.errorTitle}>Sidequest not found</Text>
          <Text style={styles.errorSubtitle}>This sidequest may have been deleted or doesn't exist.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleStatusUpdate = (newStatus: SidequestStatus) => {
    const updates: any = { status: newStatus };
    if (newStatus === SidequestStatus.COMPLETED) {
      updates.completedAt = new Date();
      updates.progress = 100;
    }
    updateSidequest(id, updates);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Sidequest',
      `Are you sure you want to delete "${sidequest.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            deleteSidequest(id);
            router.back();
          }
        },
      ]
    );
  };

  const handleSaveNotes = () => {
    updateSidequest(id, { notes: editedNotes.trim() || undefined });
    setIsEditingNotes(false);
  };

  const handleSaveProgress = () => {
    const progress = parseInt(editedProgress);
    if (isNaN(progress) || progress < 0 || progress > 100) {
      Alert.alert('Error', 'Progress must be a number between 0 and 100');
      return;
    }
    
    const updates: any = { progress };
    if (progress === 100 && sidequest.status !== SidequestStatus.COMPLETED) {
      updates.status = SidequestStatus.COMPLETED;
      updates.completedAt = new Date();
    }
    
    updateSidequest(id, updates);
    setIsEditingProgress(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const statusOptions = [
    { label: 'Not Started', value: SidequestStatus.NOT_STARTED, icon: 'ellipse-outline' },
    { label: 'In Progress', value: SidequestStatus.IN_PROGRESS, icon: 'play-circle-outline' },
    { label: 'Completed', value: SidequestStatus.COMPLETED, icon: 'checkmark-circle-outline' },
    { label: 'Paused', value: SidequestStatus.PAUSED, icon: 'pause-circle-outline' },
    { label: 'Abandoned', value: SidequestStatus.ABANDONED, icon: 'close-circle-outline' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{sidequest.title}</Text>
            <View style={styles.headerBadges}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(sidequest.status) }]}>
                <Text style={styles.statusText}>{sidequest.status.replace('_', ' ')}</Text>
              </View>
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(sidequest.difficulty) }]}>
                <Text style={styles.difficultyText}>{sidequest.difficulty}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{sidequest.description}</Text>
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons name="folder-outline" size={ComponentSizes.icon.medium} color={Colors.textSecondary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValue}>{sidequest.category}</Text>
              </View>
            </View>
            
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons name="time-outline" size={ComponentSizes.icon.medium} color={Colors.textSecondary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Estimated Time</Text>
                <Text style={styles.detailValue}>{sidequest.estimatedTime}</Text>
              </View>
            </View>
            
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons name="calendar-outline" size={ComponentSizes.icon.medium} color={Colors.textSecondary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Created</Text>
                <Text style={styles.detailValue}>{formatDate(sidequest.createdAt)}</Text>
              </View>
            </View>
            
            {sidequest.completedAt && (
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <Ionicons name="checkmark-circle-outline" size={ComponentSizes.icon.medium} color={Colors.success} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Completed</Text>
                  <Text style={styles.detailValue}>{formatDate(sidequest.completedAt)}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Progress */}
        {sidequest.progress !== undefined && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Progress</Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                  setEditedProgress(sidequest.progress?.toString() || '0');
                  setIsEditingProgress(true);
                }}
              >
                <Ionicons name="pencil" size={ComponentSizes.icon.small} color={Colors.primary} />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${sidequest.progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{sidequest.progress}%</Text>
            </View>
          </View>
        )}

        {/* Tags */}
        {sidequest.tags && sidequest.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {sidequest.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Notes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                setEditedNotes(sidequest.notes || '');
                setIsEditingNotes(true);
              }}
            >
              <Ionicons name="pencil" size={ComponentSizes.icon.small} color={Colors.primary} />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          {sidequest.notes ? (
            <Text style={styles.notes}>{sidequest.notes}</Text>
          ) : (
            <Text style={styles.emptyNotes}>No notes yet. Tap edit to add some!</Text>
          )}
        </View>

        {/* Status Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Update Status</Text>
          <View style={styles.statusActions}>
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.statusAction,
                  sidequest.status === option.value && styles.statusActionActive,
                ]}
                onPress={() => handleStatusUpdate(option.value)}
                disabled={sidequest.status === option.value}
              >
                <Ionicons
                  name={option.icon as any}
                  size={ComponentSizes.icon.medium}
                  color={sidequest.status === option.value ? Colors.textInverse : Colors.textSecondary}
                />
                <Text
                  style={[
                    styles.statusActionText,
                    sidequest.status === option.value && styles.statusActionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={ComponentSizes.icon.medium} color={Colors.error} />
          <Text style={styles.deleteButtonText}>Delete Sidequest</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Notes Modal */}
      <Modal
        visible={isEditingNotes}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsEditingNotes(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Notes</Text>
            <TouchableOpacity onPress={handleSaveNotes}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.modalTextInput}
            value={editedNotes}
            onChangeText={setEditedNotes}
            placeholder="Add your notes here..."
            placeholderTextColor={Colors.textSecondary}
            multiline
            textAlignVertical="top"
            autoFocus
          />
        </SafeAreaView>
      </Modal>

      {/* Edit Progress Modal */}
      <Modal
        visible={isEditingProgress}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsEditingProgress(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Progress</Text>
            <TouchableOpacity onPress={handleSaveProgress}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.progressInputContainer}>
            <Text style={styles.progressInputLabel}>Progress (0-100):</Text>
            <TextInput
              style={styles.progressInput}
              value={editedProgress}
              onChangeText={setEditedProgress}
              placeholder="0"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="numeric"
              autoFocus
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  headerContent: {
    padding: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    lineHeight: Typography.lineHeight['3xl'],
  },
  headerBadges: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statusBadge: {
    ...Components.badge,
  },
  statusText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    textTransform: 'capitalize',
  },
  difficultyBadge: {
    ...Components.badge,
  },
  difficultyText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  section: {
    backgroundColor: Colors.surface,
    marginTop: Spacing.sm,
    padding: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    minHeight: ComponentSizes.button.small.minHeight,
  },
  editButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  description: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.base,
  },
  detailsContainer: {
    gap: Spacing.lg,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  detailIcon: {
    width: ComponentSizes.avatar.small,
    height: ComponentSizes.avatar.small,
    borderRadius: ComponentSizes.avatar.small / 2,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.xs,
  },
  detailValue: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.semibold,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  progressBar: {
    flex: 1,
    height: ComponentSizes.progressBar.height * 1.5,
    backgroundColor: Colors.gray200,
    borderRadius: BorderRadius.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.xs,
  },
  progressText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.bold,
    minWidth: 45,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.gray100,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  notes: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.base,
  },
  emptyNotes: {
    fontSize: Typography.fontSize.base,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    lineHeight: Typography.lineHeight.base,
  },
  statusActions: {
    gap: Spacing.sm,
  },
  statusAction: {
    flexDirection: 'row',
    alignItems: 'center',
    ...ComponentSizes.button.medium,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
    gap: Spacing.md,
  },
  statusActionActive: {
    backgroundColor: Colors.primary,
  },
  statusActionText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  statusActionTextActive: {
    color: Colors.textInverse,
  },
  bottomSpacing: {
    height: 100,
  },
  footer: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    ...Shadows.sm,
  },
  deleteButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...ComponentSizes.button.medium,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.error,
    gap: Spacing.sm,
  },
  deleteButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.error,
    fontWeight: Typography.fontWeight.semibold,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['5xl'],
  },
  errorIcon: {
    marginBottom: Spacing.xl,
  },
  errorTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
    lineHeight: Typography.lineHeight.base,
  },
  backButton: {
    ...Components.button.primary,
  },
  backButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  modalCancel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  modalSave: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semibold,
  },
  modalTextInput: {
    flex: 1,
    padding: Spacing.xl,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
  },
  progressInputContainer: {
    padding: Spacing.xl,
  },
  progressInputLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.md,
  },
  progressInput: {
    ...Components.input,
    fontSize: Typography.fontSize.base,
  },
}); 