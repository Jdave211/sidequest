import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderRadius, Colors, ComponentSizes, Shadows, Spacing, Typography } from '../constants/theme';
import { useUserStore } from '../stores';

export default function SettingsModal() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const signOut = useUserStore((s) => s.signOut);
  const authUser = useUserStore((s) => s.authState.user);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const [query, setQuery] = useState('');
  const [displayName, setDisplayName] = useState(authUser?.displayName || '');
  const [themePref, setThemePref] = useState<'system' | 'light' | 'dark'>('system');
  const [isSavingName, setIsSavingName] = useState(false);
  const nameInputRef = useRef<TextInput>(null);

  useEffect(() => {
    AsyncStorage.getItem('theme_preference').then((v) => {
      if (v === 'system' || v === 'light' || v === 'dark') setThemePref(v);
    });
  }, []);

  // Keep local input in sync if auth user changes
  useEffect(() => {
    setDisplayName(authUser?.displayName || '');
  }, [authUser?.displayName]);

  const setTheme = async (pref: 'system' | 'light' | 'dark') => {
    setThemePref(pref);
    await AsyncStorage.setItem('theme_preference', pref);
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/welcome');
  };

  const handleSaveDisplayName = async () => {
    const trimmed = displayName.trim();
    if (!trimmed) {
      Alert.alert('Invalid name', 'Please enter a valid display name.');
      return;
    }
    try {
      setIsSavingName(true);
      await updateProfile({ displayName: trimmed });
      Alert.alert('Saved', 'Your display name has been updated.');
    } catch (e) {
      // updateProfile already alerts on failure
    } finally {
      setIsSavingName(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
          <Ionicons name="chevron-back" size={ComponentSizes.icon.large} color={Colors.textPrimary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      {!!authUser && (
        <Text style={styles.handleText}>@{authUser.displayName || authUser.email?.split('@')[0]}</Text>
      )}

      <View style={styles.searchBar}>
        <Ionicons name="search" size={ComponentSizes.icon.medium} color={Colors.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search settings"
          placeholderTextColor={Colors.textSecondary}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Your account</Text>
        {/* Edit Display Name Inline */}
        <View style={styles.row}>
          <View style={styles.rowIcon}><Ionicons name="person-outline" size={ComponentSizes.icon.medium} color={Colors.textSecondary} /></View>
          <View style={[styles.rowBody, { gap: 6 }]}> 
            <Text style={styles.rowTitle}>Display name</Text>
            <TextInput
              ref={nameInputRef}
              style={styles.nameInput}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="words"
              maxLength={30}
            />
          </View>
          <TouchableOpacity
            onPress={handleSaveDisplayName}
            style={[styles.saveBtn, isSavingName && { opacity: 0.7 }]}
            activeOpacity={0.8}
            disabled={isSavingName}
          >
            <Text style={styles.saveBtnText}>{isSavingName ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        {/* Focus helper row for accessibility/UX (acts like a shortcut) */}
        <TouchableOpacity style={styles.row} onPress={() => nameInputRef.current?.focus()} activeOpacity={0.7}>
          <View style={styles.rowIcon}><Ionicons name="create-outline" size={ComponentSizes.icon.medium} color={Colors.textSecondary} /></View>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle}>Edit profile</Text>
            <Text style={styles.rowSubtitle}>Quickly update your display name</Text>
          </View>
          <Ionicons name="chevron-forward" size={ComponentSizes.icon.medium} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Security and account access</Text>
        <TouchableOpacity style={styles.row} onPress={handleSignOut} activeOpacity={0.7}>
          <View style={styles.rowIcon}><Ionicons name="log-out-outline" size={ComponentSizes.icon.medium} color={Colors.textSecondary} /></View>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle}>Sign out</Text>
            <Text style={styles.rowSubtitle}>Sign out of your account on this device</Text>
          </View>
          <Ionicons name="chevron-forward" size={ComponentSizes.icon.medium} color={Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={() => {}} activeOpacity={0.7}>
          <View style={styles.rowIcon}><Ionicons name="trash-outline" size={ComponentSizes.icon.medium} color={Colors.textSecondary} /></View>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle}>Delete account</Text>
            <Text style={styles.rowSubtitle}>Permanently delete your account</Text>
          </View>
          <Ionicons name="chevron-forward" size={ComponentSizes.icon.medium} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Appearance</Text>
        {(['system','light','dark'] as const).map((opt) => (
          <TouchableOpacity key={opt} style={styles.row} onPress={() => setTheme(opt)} activeOpacity={0.7}>
            <View style={styles.rowIcon}>
              <Ionicons
                name={opt === 'system' ? 'phone-portrait-outline' : opt === 'light' ? 'sunny-outline' : 'moon-outline'}
                size={ComponentSizes.icon.medium}
                color={Colors.textSecondary}
              />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>{opt === 'system' ? 'Use system theme' : opt === 'light' ? 'Light mode' : 'Dark mode'}</Text>
              {themePref === opt ? <Text style={styles.rowSubtitle}>Selected</Text> : null}
            </View>
            <Ionicons name="chevron-forward" size={ComponentSizes.icon.medium} color={Colors.textSecondary} />
          </TouchableOpacity>
        ))}
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  backText: {
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.semibold,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  handleText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
    gap: Spacing.md,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.base,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.background,
  },
  rowIcon: {
    width: 28,
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  rowBody: { flex: 1 },
  rowTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  rowSubtitle: {
    color: Colors.textSecondary,
    marginTop: 4,
    fontSize: Typography.fontSize.sm,
  },
  nameInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadows.sm,
  },
  saveBtnText: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.semibold,
  },
});


