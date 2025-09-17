import { Ionicons } from '@expo/vector-icons';
import { decode } from 'base-64';
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
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your photos to attach an image.');
      return;
    }
    try {
      console.log('[AddSidequest] Opening image picker');
      await new Promise((r) => setTimeout(r, 120));
      const result = await ImagePicker.launchImageLibraryAsync({ 
        mediaTypes: ['images'], 
        allowsMultipleSelection: true,
        selectionLimit: 5,
        quality: 0.9 
      });
      console.log('[AddSidequest] Picker result:', result?.canceled ? 'canceled' : 'selected');
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUris(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 5));
      }
    } catch (e) {
      console.warn('[AddSidequest] Image picker failed', e);
      Alert.alert('Error', 'Failed to open image library.');
    }
  };

  const uploadImagesIfAny = async (): Promise<string[] | undefined> => {
    if (!imageUris.length || !authState.user) return undefined;
    const uploaded: string[] = [];
    for (const uri of imageUris) {
      try {
        console.log('[AddSidequest] Uploading image:', uri);
        // First check if URI is valid
        console.log('[AddSidequest] Processing image URI:', uri);
        
        // Convert local file URI to base64
        const base64Response = await fetch(uri);
        const imageBlob = await base64Response.blob();
        
        // Convert blob to base64 string
        const reader = new FileReader();
        const base64String = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
              const base64 = reader.result.split(',')[1];
              resolve(base64);
            } else {
              reject(new Error('Failed to convert to base64'));
            }
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(imageBlob);
        });
        
        console.log('[AddSidequest] Converted to base64, length:', base64String.length);
        
        const path = `${authState.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
        console.log('[AddSidequest] Upload path:', path);
        
        // Upload base64 data
        const { data, error } = await supabase.storage.from('sidequest-images').upload(path, decode(base64String), { 
          contentType: 'image/jpeg',
          upsert: false 
        });
        
        if (error) {
          console.error('[AddSidequest] Upload error:', error);
          throw error;
        }
        
        console.log('[AddSidequest] Upload success:', data);
        const { data: publicUrl } = supabase.storage.from('sidequest-images').getPublicUrl(data.path);
        console.log('[AddSidequest] Public URL:', publicUrl.publicUrl);
        uploaded.push(publicUrl.publicUrl);
      } catch (err) {
        console.error('[AddSidequest] Image upload failed:', err);
        throw err;
      }
    }
    return uploaded;
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
      const imageUrls = await uploadImagesIfAny();
      
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
      }, authState.user.id, { image_urls: imageUrls, location: location.trim() || undefined });

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
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          <Ionicons name="image" size={ComponentSizes.icon.large} color={Colors.primary} />
          <Text style={styles.imagePickerText}>Pick image(s)</Text>
        </TouchableOpacity>
        {imageUris.length > 0 && (
          <View style={{ marginTop: Spacing.sm }}>
            <Image source={{ uri: imageUris[0] }} style={styles.image} />
            {imageUris.length > 1 && (
              <Text style={{ color: Colors.textSecondary, marginTop: Spacing.xs }}>{`+${imageUris.length - 1} more`}</Text>
            )}
          </View>
        )}
        <Text style={[styles.label, { marginTop: Spacing.md }]}>Location (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="eg. Vancouver, BC"
          placeholderTextColor={Colors.textTertiary}
          value={location}
          onChangeText={setLocation}
        />

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