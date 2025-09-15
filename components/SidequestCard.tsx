import React from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../constants/theme';

// Stock images for sidequests
const SIDEQUEST_STOCK_IMAGES = [
  require('../assets/images/sidequest_stock_images/beach1.jpg'),
  require('../assets/images/sidequest_stock_images/beach2.png'),
  require('../assets/images/sidequest_stock_images/ski1.png'),
  require('../assets/images/sidequest_stock_images/sky1.png'),
  require('../assets/images/sidequest_stock_images/sky2.png'),
  require('../assets/images/sidequest_stock_images/snow1.png'),
  require('../assets/images/sidequest_stock_images/snow2.png'),
] as const;

// Hash function for consistent image selection
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

const getSidequestImageSource = (item: any) => {
  if (item.image_url) {
    return { uri: item.image_url };
  }
  // Use title to consistently select same image for same sidequest
  const index = hashString(item.title || item.id) % SIDEQUEST_STOCK_IMAGES.length;
  return SIDEQUEST_STOCK_IMAGES[index];
};

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
  
  return date.toLocaleDateString();
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'completed': return Colors.success;
    case 'started': return Colors.primary;
    case 'created': return Colors.info;
    default: return Colors.textSecondary;
  }
};

interface SidequestCardProps {
  item: any;
  spaceName?: string;
  onPress?: () => void;
}

export default function SidequestCard({ item, spaceName, onPress }: SidequestCardProps) {
  const sidequestTitle = item.sidequest?.title || item.title || 'Untitled Sidequest';
  const displaySpaceName = spaceName || 'Unknown Space';
  
  return (
    <TouchableOpacity style={styles.listingCard} onPress={onPress} activeOpacity={0.7}>
      {/* Main Image */}
      <View style={styles.imageContainer}>
        <Image 
          source={getSidequestImageSource(item.sidequest || item)} 
          style={styles.listingImage} 
          resizeMode="cover"
        />
        <View style={[styles.statusBadge, { backgroundColor: getActivityColor(item.activity_type) }]}>
          <Text style={styles.statusText}>{item.activity_type}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.listingContent}>
        {/* Title and Location */}
        <View style={styles.titleRow}>
          <Text style={styles.listingTitle} numberOfLines={1}>
            {sidequestTitle}
          </Text>
        </View>
        
        {/* Space Name */}
        <Text style={styles.locationText} numberOfLines={1}>
          {displaySpaceName}
        </Text>
        
        {/* User Activity */}
        <Text style={styles.hostText}>
          {item.user?.display_name || 'User'} • {formatTimeAgo(new Date(item.created_at))}
        </Text>
        
        {/* Description */}
        {item.sidequest?.description && (
          <Text style={styles.descriptionText} numberOfLines={2}>
            {item.sidequest.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Airbnb-style listing card
  listingCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    ...Shadows.md,
  },
  
  // Image container with overlay badge
  imageContainer: {
    position: 'relative',
  },
  listingImage: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.surface,
  },
  statusBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    textTransform: 'capitalize',
  },
  
  // Content section
  listingContent: {
    padding: Spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  listingTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
  },
  locationText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  hostText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  descriptionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.sm,
  },
});
