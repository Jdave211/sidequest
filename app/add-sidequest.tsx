import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { BorderRadius, Colors, ComponentSizes, Shadows, Spacing, Typography } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { useSidequestStore, useUserStore } from '../stores';
import { SidequestCategory, SidequestDifficulty, SidequestStatus } from '../types/sidequest';

export default function AddSidequest() {
  const addSidequest = useSidequestStore((state) => state.addSidequest);
  const authState = useUserStore((state) => state.authState);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your photos to attach an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      quality: 0.9 
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImageIfAny = async (): Promise<string | undefined> => {
    if (!imageUri || !authState.user) return undefined;
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const path = `${authState.user.id}/${Date.now()}.jpg`;
    const { data, error } = await supabase.storage.from('social-sidequests').upload(path, blob, { 
      contentType: 'image/jpeg', 
      upsert: false 
    });
    if (error) throw error;
    const { data: publicUrl } = supabase.storage.from('social-sidequests').getPublicUrl(data.path);
    return publicUrl.publicUrl;
  };

  const handleSubmit = async () => {
    if (!authState.user) {
      Alert.alert('Not signed in', 'Please sign in to add a sidequest.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a title for your sidequest.');
      return;
    }

    try {
      setIsSubmitting(true);
      const imageUrl = await uploadImageIfAny();
      
      await addSidequest({
        title: title.trim(),
        description: description.trim() || 'Personal sidequest',
        category: SidequestCategory.OTHER,
        difficulty: SidequestDifficulty.MEDIUM,
        estimatedTime: 'Unknown',
        status: SidequestStatus.NOT_STARTED,
        tags: [],
        notes: description.trim() || undefined,
        progress: 0,
      }, authState.user.id);

      Alert.alert('Success', 'Sidequest added successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('[AddSidequest] Failed to create:', error);
      Alert.alert('Error', error?.message || 'Failed to add sidequest');
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
        <Text style={styles.title}>Add Sidequest</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="What's your sidequest?"
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

        <Text style={[styles.label, { marginTop: Spacing.md }]}>Description (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tell us more about your sidequest"
          placeholderTextColor={Colors.textTertiary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity 
          style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]} 
          onPress={handleSubmit} 
          disabled={isSubmitting}
        >
          <Ionicons name="checkmark" size={ComponentSizes.icon.medium} color={Colors.white} />
          <Text style={styles.submitText}>{isSubmitting ? 'Saving...' : 'Add Sidequest'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background 
  },
  header: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, 
    paddingVertical: Spacing.lg,
  },
  iconBtn: { 
    width: 40, 
    height: 40 
  },
  title: { 
    fontSize: Typography.fontSize['2xl'], 
    fontWeight: Typography.fontWeight.bold, 
    color: Colors.textPrimary 
  },
  content: { 
    paddingHorizontal: Spacing.xl 
  },
  label: { 
    color: Colors.textSecondary, 
    fontSize: Typography.fontSize.sm 
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
    minHeight: 110 
  },
  imagePicker: { 
    marginTop: Spacing.sm, 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: Spacing.lg, 
    borderWidth: 1, 
    borderColor: Colors.border, 
    borderRadius: BorderRadius.md, 
    backgroundColor: Colors.white, 
    ...Shadows.sm 
  },
  imagePickerText: { 
    marginTop: Spacing.xs, 
    color: Colors.textSecondary 
  },
  image: { 
    marginTop: Spacing.sm, 
    width: '100%', 
    height: 220, 
    borderRadius: BorderRadius.md 
  },
  submitBtn: { 
    marginTop: Spacing.xl, 
    backgroundColor: Colors.primary, 
    borderRadius: BorderRadius.md, 
    paddingVertical: Spacing.md, 
    alignItems: 'center', 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: Spacing.sm 
  },
  submitText: { 
    color: Colors.white, 
    fontWeight: Typography.fontWeight.semibold, 
    fontSize: Typography.fontSize.base 
  },
}); 