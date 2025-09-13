import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { BorderRadius, Colors, Components, ComponentSizes, Shadows, Spacing, Typography } from '../constants/theme';
import { useSidequestStore } from '../stores';
import { SidequestCategory, SidequestDifficulty, SidequestStatus } from '../types/sidequest';

export default function AddSidequest() {
  const addSidequest = useSidequestStore((state) => state.addSidequest);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: SidequestCategory.OTHER,
    difficulty: SidequestDifficulty.MEDIUM,
    estimatedTime: '',
    tags: '',
    notes: '',
    startImmediately: false,
  });

  const categories = [
    { label: 'Creative', value: SidequestCategory.CREATIVE, icon: 'brush' },
    { label: 'Learning', value: SidequestCategory.LEARNING, icon: 'book' },
    { label: 'Fitness', value: SidequestCategory.FITNESS, icon: 'barbell' },
    { label: 'Social', value: SidequestCategory.SOCIAL, icon: 'people' },
    { label: 'Career', value: SidequestCategory.CAREER, icon: 'briefcase' },
    { label: 'Hobby', value: SidequestCategory.HOBBY, icon: 'game-controller' },
    { label: 'Adventure', value: SidequestCategory.ADVENTURE, icon: 'compass' },
    { label: 'Productivity', value: SidequestCategory.PRODUCTIVITY, icon: 'checkmark-circle' },
    { label: 'Health', value: SidequestCategory.HEALTH, icon: 'medical' },
    { label: 'Other', value: SidequestCategory.OTHER, icon: 'ellipsis-horizontal' },
  ];

  const difficulties = [
    { label: 'Easy', value: SidequestDifficulty.EASY, color: Colors.difficultyEasy },
    { label: 'Medium', value: SidequestDifficulty.MEDIUM, color: Colors.difficultyMedium },
    { label: 'Hard', value: SidequestDifficulty.HARD, color: Colors.difficultyHard },
    { label: 'Expert', value: SidequestDifficulty.EXPERT, color: Colors.difficultyExpert },
  ];

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a title for your sidequest');
      return;
    }

    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter a description for your sidequest');
      return;
    }

    if (!formData.estimatedTime.trim()) {
      Alert.alert('Error', 'Please enter an estimated time for your sidequest');
      return;
    }

    const tags = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    addSidequest({
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      difficulty: formData.difficulty,
      estimatedTime: formData.estimatedTime.trim(),
      status: formData.startImmediately ? SidequestStatus.IN_PROGRESS : SidequestStatus.NOT_STARTED,
      tags,
      notes: formData.notes.trim() || undefined,
      progress: 0,
    });

    Alert.alert(
      'Success',
      'Sidequest added successfully!',
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={ComponentSizes.icon.large} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Sidequest</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Enter sidequest title"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Describe your sidequest in detail"
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Estimated Time *</Text>
            <TextInput
              style={styles.input}
              value={formData.estimatedTime}
              onChangeText={(text) => setFormData({ ...formData, estimatedTime: text })}
              placeholder="e.g., 2 weeks, 1 month, 3 days"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.value}
                style={[
                  styles.categoryButton,
                  formData.category === category.value && styles.categoryButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, category: category.value })}
              >
                <Ionicons
                  name={category.icon as any}
                  size={ComponentSizes.icon.large}
                  color={formData.category === category.value ? Colors.primary : Colors.textSecondary}
                />
                <Text
                  style={[
                    styles.categoryText,
                    formData.category === category.value && styles.categoryTextActive,
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Difficulty Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Difficulty</Text>
          <View style={styles.difficultyContainer}>
            {difficulties.map((difficulty) => (
              <TouchableOpacity
                key={difficulty.value}
                style={[
                  styles.difficultyButton,
                  formData.difficulty === difficulty.value && [
                    styles.difficultyButtonActive,
                    { backgroundColor: difficulty.color }
                  ],
                ]}
                onPress={() => setFormData({ ...formData, difficulty: difficulty.value })}
              >
                <Text
                  style={[
                    styles.difficultyText,
                    formData.difficulty === difficulty.value && styles.difficultyTextActive,
                  ]}
                >
                  {difficulty.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Additional Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tags</Text>
            <TextInput
              style={styles.input}
              value={formData.tags}
              onChangeText={(text) => setFormData({ ...formData, tags: text })}
              placeholder="Enter tags separated by commas"
              placeholderTextColor={Colors.textSecondary}
            />
            <Text style={styles.inputHint}>
              Add tags to help organize your sidequests (e.g., outdoor, creative, challenge)
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Add any additional notes or details"
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Start Immediately Option */}
        <View style={styles.section}>
          <View style={styles.switchContainer}>
            <View style={styles.switchContent}>
              <Text style={styles.switchLabel}>Start Immediately</Text>
              <Text style={styles.switchDescription}>
                Mark this sidequest as "In Progress" right away
              </Text>
            </View>
            <Switch
              value={formData.startImmediately}
              onValueChange={(value) => setFormData({ ...formData, startImmediately: value })}
              trackColor={{ false: Colors.gray200, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Fixed Bottom Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
        >
          <Ionicons name="checkmark" size={ComponentSizes.icon.medium} color={Colors.textInverse} />
          <Text style={styles.submitButtonText}>Add Sidequest</Text>
        </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    ...Shadows.sm,
  },
  headerButton: {
    width: ComponentSizes.button.medium.minHeight,
    height: ComponentSizes.button.medium.minHeight,
    borderRadius: ComponentSizes.button.medium.minHeight / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: Colors.surface,
    marginTop: Spacing.sm,
    padding: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  input: {
    ...Components.input,
    fontSize: Typography.fontSize.base,
  },
  textArea: {
    height: ComponentSizes.input.large.minHeight * 2,
    paddingTop: Spacing.md,
  },
  inputHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: Typography.lineHeight.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  categoryButton: {
    ...ComponentSizes.categoryButton,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: Spacing.sm,
  },
  categoryButtonActive: {
    backgroundColor: Colors.white,
    borderColor: Colors.primary,
  },
  categoryText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  categoryTextActive: {
    color: Colors.primary,
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  difficultyButton: {
    ...ComponentSizes.button.medium,
    flex: 1,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyButtonActive: {
    borderColor: Colors.white,
    ...Shadows.sm,
  },
  difficultyText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  difficultyTextActive: {
    color: Colors.textInverse,
    fontWeight: Typography.fontWeight.semibold,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  switchContent: {
    flex: 1,
    marginRight: Spacing.lg,
  },
  switchLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  switchDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.sm,
  },
  bottomSpacing: {
    height: 100,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    ...Shadows.sm,
  },
  cancelButton: {
    ...Components.button.secondary,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  submitButton: {
    ...Components.button.primary,
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  submitButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textInverse,
  },
}); 