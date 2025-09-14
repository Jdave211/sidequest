import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Colors, ComponentSizes, Shadows, Spacing, Typography } from '../../constants/theme';
import { useSocialStore, useUserStore } from '../../stores';

export default function CreateSpace() {
  const router = useRouter();
  const authState = useUserStore((s) => s.authState);
  const createCircle = useSocialStore((s) => s.createCircle);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please enter a space name.');
      return;
    }
    if (!authState.user) {
      Alert.alert('Not signed in', 'Please sign in to create a space.');
      router.replace('/welcome');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('[CreateSpace] Creating circle with', { name: name.trim(), description: description.trim() });
      const circle = await createCircle(name.trim(), description.trim() || undefined, authState.user.id);
      console.log('[CreateSpace] Circle created', { id: circle.id, code: circle.code });
      Alert.alert('Space Created', `"${circle.name}" is ready!\n\nInvite code: ${circle.code}`);
      router.replace('/(tabs)/social');
    } catch (e: any) {
      console.error('[CreateSpace] Failed to create circle:', e?.message || e);
      Alert.alert('Error', e?.message || 'Failed to create space.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}> 
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={ComponentSizes.icon.large} color={Colors.textPrimary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Space</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Space name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Weekend Warriors"
          placeholderTextColor={Colors.textTertiary}
          value={name}
          onChangeText={setName}
          maxLength={50}
        />

        <Text style={[styles.label, { marginTop: Spacing.md }]}>Description (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="What is this space about?"
          placeholderTextColor={Colors.textTertiary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          maxLength={200}
        />

        <TouchableOpacity style={[styles.createBtn, isSubmitting && { opacity: 0.7 }]} onPress={onCreate} disabled={isSubmitting}>
          <Ionicons name="create-outline" size={ComponentSizes.icon.medium} color={Colors.white} />
          <Text style={styles.createText}>{isSubmitting ? 'Creating...' : 'Create'}</Text>
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
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  backText: {
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.semibold,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    ...Shadows.sm,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  createBtn: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.md,
  },
  createText: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.semibold,
    fontSize: Typography.fontSize.base,
  },
});


