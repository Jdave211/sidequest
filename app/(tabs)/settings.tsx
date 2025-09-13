import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import {
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderRadius, Colors, ComponentSizes, Shadows, Spacing, Typography } from '../../constants/theme';
import { useUserStore } from '../../stores';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';

type Row = {
  key: string;
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  type?: 'link' | 'action';
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const signOut = useUserStore((s) => s.signOut);
  const authUser = useUserStore((s) => s.authState.user);
  const updateProfile = useUserStore((s) => s.updateProfile);

  const [query, setQuery] = useState('');
  const [displayName, setDisplayName] = useState(authUser?.displayName || '');
  const [themePref, setThemePref] = useState<'system' | 'light' | 'dark'>('system');

  useEffect(() => {
    AsyncStorage.getItem('theme_preference').then((v) => {
      if (v === 'system' || v === 'light' || v === 'dark') setThemePref(v);
    });
  }, []);

  const setTheme = async (pref: 'system' | 'light' | 'dark') => {
    setThemePref(pref);
    await AsyncStorage.setItem('theme_preference', pref);
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/welcome');
  };

  const handleDeleteAccount = async () => {
    // Placeholder: you can wire a backend function to delete user data later
    await signOut();
    router.replace('/welcome');
  };

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      // For now, store local URI as avatarUrl; later, upload to storage and save public URL
      await updateProfile({ avatarUrl: result.assets[0].uri });
    }
  };

  const sections = useMemo(() => {
    const rows: Array<{ header: string; items: Row[] }> = [
      {
        header: 'Your account',
        items: [
          {
            key: 'edit-profile',
            title: 'Edit profile',
            subtitle: 'Update your display name',
            icon: 'person-outline',
            onPress: undefined,
          },
          {
            key: 'edit-avatar',
            title: 'Change profile picture',
            subtitle: 'Pick a photo from your library',
            icon: 'image-outline',
            onPress: pickAvatar,
          },
        ],
      },
      {
        header: 'Security and account access',
        items: [
          {
            key: 'sign-out',
            title: 'Sign out',
            subtitle: 'Sign out of your account on this device',
            icon: 'log-out-outline',
            onPress: handleSignOut,
            type: 'action',
          },
          {
            key: 'delete-account',
            title: 'Delete account',
            subtitle: 'Permanently delete your account (coming soon)',
            icon: 'trash-outline',
            onPress: handleDeleteAccount,
            type: 'action',
          },
        ],
      },
      {
        header: 'Appearance',
        items: [
          {
            key: 'theme-system',
            title: 'Use system theme',
            subtitle: themePref === 'system' ? 'Selected' : undefined,
            icon: 'phone-portrait-outline',
            onPress: () => setTheme('system'),
          },
          {
            key: 'theme-light',
            title: 'Light mode',
            subtitle: themePref === 'light' ? 'Selected' : undefined,
            icon: 'sunny-outline',
            onPress: () => setTheme('light'),
          },
          {
            key: 'theme-dark',
            title: 'Dark mode',
            subtitle: themePref === 'dark' ? 'Selected' : undefined,
            icon: 'moon-outline',
            onPress: () => setTheme('dark'),
          },
        ],
      },
    ];
    const flat = rows.flatMap((s) => [{ header: s.header } as any, ...s.items]);
    if (!query.trim()) return flat;
    const q = query.toLowerCase();
    return flat.filter((r: any) => r.header || r.title?.toLowerCase().includes(q) || r.subtitle?.toLowerCase().includes(q));
  }, [query, themePref]);

  const renderItem = ({ item }: { item: any }) => {
    if (item.header) {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>{item.header}</Text>
        </View>
      );
    }
    const Icon = (
      <Ionicons name={item.icon || 'chevron-forward-outline'} size={ComponentSizes.icon.medium} color={Colors.textSecondary} />
    );
    return (
      <TouchableOpacity style={styles.row} onPress={item.onPress} activeOpacity={0.7}>
        <View style={styles.rowIcon}>{Icon}</View>
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle}>{item.title}</Text>
          {item.subtitle ? <Text style={styles.rowSubtitle}>{item.subtitle}</Text> : null}
        </View>
        <Ionicons name="chevron-forward" size={ComponentSizes.icon.medium} color={Colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>{authUser ? `@${authUser.displayName || authUser.email?.split('@')[0]}` : ''}</Text>
      </View>

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

      <FlatList
        data={sections}
        keyExtractor={(item, index) => item.key || `header-${index}`}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.lg,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
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
  listContent: {
    paddingBottom: Spacing['6xl'],
  },
  sectionHeader: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },
  sectionHeaderText: {
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
  rowBody: {
    flex: 1,
  },
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
  separator: {
    height: 1,
    backgroundColor: Colors.border,
  },
});


