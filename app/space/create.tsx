import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Animated, Dimensions, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useSocialStore, useUserStore } from '../../stores';
import { uploadImageToSupabase } from '../../utils/imageUpload';

const { width } = Dimensions.get('window');

export default function CreateSpace() {
  const router = useRouter();
  const authState = useUserStore((s) => s.authState);
  const createCircle = useSocialStore((s) => s.createCircle);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [displayPicture, setDisplayPicture] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  // Animation on mount
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
    setDisplayPicture(null);
  };

  const formatError = (err: any): { title: string; message: string } => {
    try {
      const code = err?.code || err?.status || err?.name;
      const msg = err?.message || err?.error_description || 'Unknown error';
      const details = err?.details || err?.hint || err?.body || '';
      const composed = [msg, code ? `Code: ${code}` : null, details ? `Details: ${typeof details === 'string' ? details : JSON.stringify(details)}` : null]
        .filter(Boolean)
        .join('\n');
      return { title: 'Failed to create space', message: composed };
    } catch (_) {
      return { title: 'Failed to create space', message: 'An unexpected error occurred.' };
    }
  };

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
      console.log('[CreateSpace] Start', {
        ts: new Date().toISOString(),
        payload: { name: name.trim(), description: description.trim(), hasDisplayPicture: !!displayPicture },
        user: {
          id: authState.user.id,
          email: authState.user.email,
          displayName: authState.user.displayName,
        },
        onboarding: authState.onboardingState,
      });
      
      // Upload display picture if selected
      let displayPictureUrl: string | undefined;
      if (displayPicture) {
        try {
          displayPictureUrl = await uploadImageToSupabase(displayPicture, 'space-images');
          console.log('[CreateSpace] Display picture uploaded:', displayPictureUrl);
        } catch (error) {
          console.error('[CreateSpace] Display picture upload failed:', error);
          Alert.alert('Warning', 'Failed to upload display picture, but space will be created without it.');
        }
      }
      
      // Check Supabase client session
      const { data: session } = await supabase.auth.getSession();
      console.log('[CreateSpace] Supabase session check', {
        hasSession: !!session.session,
        userId: session.session?.user?.id,
        sessionValid: session.session && !session.session.expires_at || new Date(session.session.expires_at * 1000) > new Date(),
      });
      const circle = await createCircle(name.trim(), description.trim() || undefined, displayPictureUrl, authState.user.id);
      console.log('[CreateSpace] Success', { id: circle.id, code: circle.code, name: circle.name });
      Alert.alert('Space Created', `"${circle.name}" is ready!\n\nInvite code: ${circle.code}`);
      router.replace('/(tabs)/social');
    } catch (e: any) {
      // Log full error object (best-effort) and surface rich details
      try {
        console.error('[CreateSpace] Error object:', e);
        if (e?.code || e?.message || e?.details || e?.hint) {
          console.error('[CreateSpace] Error details:', {
            code: e?.code,
            message: e?.message,
            details: e?.details,
            hint: e?.hint,
            status: e?.status,
            name: e?.name,
          });
        }
      } catch {}
      const fe = formatError(e);
      Alert.alert(fe.title, fe.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Animated Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Create Space</Text>
          <Text style={styles.subtitle}>Build your community</Text>
        </View>
        <View style={{ width: 60 }} />
      </Animated.View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          
          {/* Display Picture Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Space Picture</Text>
            <Text style={styles.sectionSubtitle}>Add a photo to represent your space (optional)</Text>
            
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
                  <Text style={styles.imagePlaceholderText}>Tap to add photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Space Name Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Space Name</Text>
            <Text style={styles.sectionSubtitle}>Give your space a memorable name</Text>
            
            <View style={styles.inputContainer}>
              <Ionicons name="people" size={20} color={Colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Weekend Warriors, Book Club, Fitness Buddies"
                placeholderTextColor={Colors.textTertiary}
                value={name}
                onChangeText={setName}
                maxLength={50}
              />
            </View>
            <Text style={styles.characterCount}>{name.length}/50</Text>
          </View>

          {/* Description Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.sectionSubtitle}>Tell people what your space is about (optional)</Text>
            
            <View style={styles.inputContainer}>
              <Ionicons name="document-text" size={20} color={Colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe the purpose, goals, or vibe of your space..."
                placeholderTextColor={Colors.textTertiary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={200}
                textAlignVertical="top"
              />
            </View>
            <Text style={styles.characterCount}>{description.length}/200</Text>
          </View>

          {/* Create Button */}
          <TouchableOpacity 
            style={[styles.createBtn, isSubmitting && styles.createBtnDisabled]} 
            onPress={onCreate} 
            disabled={isSubmitting || !name.trim()}
          >
            <View style={styles.createBtnContent}>
              {isSubmitting ? (
                <View style={styles.loadingContainer}>
                  <View style={styles.loadingSpinner} />
                  <Text style={styles.createText}>Creating Space...</Text>
                </View>
              ) : (
                <>
                  <Ionicons name="rocket" size={20} color={Colors.white} />
                  <Text style={styles.createText}>Create Space</Text>
                </>
              )}
            </View>
          </TouchableOpacity>

          {/* Tips Section */}
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>💡 Tips for a great space</Text>
            <Text style={styles.tipText}>• Choose a clear, descriptive name</Text>
            <Text style={styles.tipText}>• Add a photo that represents your community</Text>
            <Text style={styles.tipText}>• Write a description to attract like-minded people</Text>
          </View>
        </Animated.View>
      </ScrollView>
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
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  backText: {
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.semibold,
    fontSize: Typography.fontSize.base,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
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
  inputContainer: {
    position: 'relative',
    marginBottom: Spacing.xs,
  },
  inputIcon: {
    position: 'absolute',
    left: Spacing.md,
    top: 18,
    zIndex: 1,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    ...Shadows.sm,
    minHeight: 56,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: Spacing.md,
  },
  characterCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  createBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.lg,
  },
  createBtnDisabled: {
    backgroundColor: Colors.textTertiary,
    opacity: 0.6,
  },
  createBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loadingSpinner: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: Colors.white,
    borderTopColor: 'transparent',
    borderRadius: 8,
    transform: [{ rotate: '45deg' }],
  },
  createText: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.bold,
    fontSize: Typography.fontSize.lg,
  },
  tipsSection: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    ...Shadows.sm,
  },
  tipsTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  tipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
});



