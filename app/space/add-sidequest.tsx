import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Colors, ComponentSizes, Shadows, Spacing, Typography } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useSocialStore, useUserStore } from '../../stores';

export default function AddSpaceSidequest() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const authState = useUserStore((s) => s.authState);
  const currentCircle = useSocialStore((s) => s.currentCircle);
  const createSocialSidequest = useSocialStore((s) => s.createSocialSidequest);

  const [title, setTitle] = useState(typeof params?.title === 'string' ? params.title : '');
  const [review, setReview] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your photos to attach an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9 });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImageIfAny = async (): Promise<string | undefined> => {
    if (!imageUri || !authState.user) return undefined;
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const path = `${authState.user.id}/${Date.now()}.jpg`;
    const { data, error } = await supabase.storage.from('social-sidequests').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
    if (error) throw error;
    const { data: publicUrl } = supabase.storage.from('social-sidequests').getPublicUrl(data.path);
    return publicUrl.publicUrl;
  };

  const onSubmit = async () => {
    if (!authState.user) {
      Alert.alert('Not signed in', 'Please sign in to add a sidequest.');
      return;
    }
    if (!currentCircle) {
      Alert.alert('No space selected', 'Please select or create a space first.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a title.');
      return;
    }

    try {
      setIsSubmitting(true);
      const imageUrl = await uploadImageIfAny();
      const created = await createSocialSidequest({
        title: title.trim(),
        description: review.trim() || undefined,
        created_by: authState.user.id,
        circle_id: currentCircle.id,
        visibility: 'circle',
        image_url: imageUrl,
        review: review.trim() || undefined,
        category: 'other',
        difficulty: 'easy',
        status: 'not_started',
      } as any);
      Alert.alert('Added', 'Sidequest added to this space.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      console.error('[AddSpaceSidequest] Failed to create', e);
      Alert.alert('Error', e?.message || 'Failed to add sidequest');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="close" size={ComponentSizes.icon.large} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Add to Space</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="What are you adding?"
          placeholderTextColor={Colors.textTertiary}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={[styles.label, { marginTop: Spacing.md }]}>Image (optional)</Text>
        {imageUri ? (
          <TouchableOpacity onPress={pickImage}>
            <Image source={{ uri: imageUri }} style={styles.image} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            <Ionicons name="image" size={ComponentSizes.icon.large} color={Colors.primary} />
            <Text style={styles.imagePickerText}>Pick an image</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.label, { marginTop: Spacing.md }]}>Review (only visible as posted by you)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Write your review or notes"
          placeholderTextColor={Colors.textTertiary}
          value={review}
          onChangeText={setReview}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]} onPress={onSubmit} disabled={isSubmitting}>
          <Ionicons name="checkmark" size={ComponentSizes.icon.medium} color={Colors.white} />
          <Text style={styles.submitText}>{isSubmitting ? 'Saving...' : 'Add to Space'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
  },
  iconBtn: { width: 40, height: 40 },
  title: { fontSize: Typography.fontSize['2xl'], fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  content: { paddingHorizontal: Spacing.xl },
  label: { color: Colors.textSecondary, fontSize: Typography.fontSize.sm },
  input: {
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, fontSize: Typography.fontSize.base, color: Colors.textPrimary, ...Shadows.sm,
  },
  textArea: { minHeight: 110 },
  imagePicker: { marginTop: Spacing.sm, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, backgroundColor: Colors.white, ...Shadows.sm },
  imagePickerText: { marginTop: Spacing.xs, color: Colors.textSecondary },
  image: { marginTop: Spacing.sm, width: '100%', height: 220, borderRadius: BorderRadius.md },
  submitBtn: { marginTop: Spacing.xl, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.md, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm },
  submitText: { color: Colors.white, fontWeight: Typography.fontWeight.semibold, fontSize: Typography.fontSize.base },
});


