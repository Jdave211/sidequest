import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React from 'react';
import {
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { BorderRadius, Colors, ComponentSizes, Shadows, Spacing, Typography } from '../constants/theme';
import { useSocialStore } from '../stores';

// Fallback images for spaces without a cover image
const SPACE_STOCK_IMAGES = [
  require('../assets/images/spaces_stock_images/beach1.jpg'),
  require('../assets/images/spaces_stock_images/beach2.png'),
  require('../assets/images/spaces_stock_images/ski1.png'),
  require('../assets/images/spaces_stock_images/sky1.png'),
  require('../assets/images/spaces_stock_images/sky2.png'),
  require('../assets/images/spaces_stock_images/snow1.png'),
  require('../assets/images/spaces_stock_images/snow2.png'),
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function getCircleImageSource(circle: any) {
  if (circle?.image_url) {
    return { uri: circle.image_url } as const;
  }
  const key = circle?.id || circle?.code || circle?.name || String(Math.random());
  const idx = hashString(String(key)) % SPACE_STOCK_IMAGES.length;
  return SPACE_STOCK_IMAGES[idx];
}

interface SpaceCardProps {
  item: any;
  isActive?: boolean;
  onPress: () => void;
  onAddSidequest: () => void;
}

export default function SpaceCard({ item, isActive, onPress, onAddSidequest }: SpaceCardProps) {
  const router = useRouter();
  const setCurrentCircle = useSocialStore((state) => state.setCurrentCircle);

  const copyToClipboard = async (text: string, message: string) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Copied!', message);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const shareSpace = async (circle: any) => {
    try {
      const shareUrl = `sidequest://space/join?code=${circle.code}`;
      const message = `Join my space "${circle.name}" on Sidequest!\n\nCode: ${circle.code}\nLink: ${shareUrl}`;
      
      await Sharing.shareAsync(message);
    } catch (error) {
      console.error('Error sharing space:', error);
      Alert.alert('Error', 'Failed to share space');
    }
  };

  return (
    <View style={[styles.circleCard, isActive && styles.circleCardActive]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Image source={getCircleImageSource(item)} style={styles.circleImage} resizeMode="cover" />
        <View style={styles.circleCardContent}>
          <View style={styles.circleHeader}>
            <View style={styles.circleIcon}>
              <Ionicons name="people" size={ComponentSizes.icon.large} color={Colors.primary} />
            </View>
            <View style={styles.circleInfo}>
              <Text style={styles.circleName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.circleCode}>Code: {item.code}</Text>
              {item.description && (
                <Text style={styles.circleDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.circleStats}>
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={ComponentSizes.icon.small} color={Colors.textSecondary} />
              <Text style={styles.statText}>{Math.max(1, item.member_count || 0)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
      
      {/* Space Actions */}
      <View style={styles.circleActions}>
        <TouchableOpacity 
          style={styles.circleActionButton}
          onPress={onAddSidequest}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={ComponentSizes.icon.small} color={Colors.primary} />
          <Text style={styles.circleActionText}>Add</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.circleActionButton} 
          onPress={() => copyToClipboard(item.code, 'Invite code copied!')}
          activeOpacity={0.7}
        >
          <Ionicons name="copy-outline" size={ComponentSizes.icon.small} color={Colors.primary} />
          <Text style={styles.circleActionText}>Copy</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.circleActionButton} 
          onPress={() => shareSpace(item)}
          activeOpacity={0.7}
        >
          <Ionicons name="share-outline" size={ComponentSizes.icon.small} color={Colors.primary} />
          <Text style={styles.circleActionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  circleCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  circleImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  circleCardActive: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  circleCardContent: {
    padding: Spacing.lg,
  },
  circleActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  circleActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  circleActionText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
  },
  circleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  circleIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  circleInfo: {
    flex: 1,
  },
  circleName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  circleCode: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  circleDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.sm,
  },
  circleStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
});
