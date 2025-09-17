import { Ionicons } from '@expo/vector-icons';
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
  // Priority 1: Activity has image_urls (from sidequest_activities table)
  if (Array.isArray(item.image_urls) && item.image_urls.length > 0 && item.image_urls[0]) {
    // Add cache busting and explicit headers for React Native Image
    const imageUrl = item.image_urls[0];
    return { 
      uri: imageUrl,
      cache: 'force-cache',
      headers: {
        'Accept': 'image/*',
      }
    };
  }
  
  // Priority 2: Check nested sidequest object for image_urls
  if (item.sidequest && Array.isArray(item.sidequest.image_urls) && item.sidequest.image_urls.length > 0) {
    return { 
      uri: item.sidequest.image_urls[0],
      cache: 'force-cache',
      headers: {
        'Accept': 'image/*',
      }
    };
  }
  
  // Priority 3: Backward compatibility - single image_url
  if (item.image_url) {
    return { 
      uri: item.image_url,
      cache: 'force-cache',
      headers: {
        'Accept': 'image/*',
      }
    };
  }
  if (item.sidequest && item.sidequest.image_url) {
    return { 
      uri: item.sidequest.image_url,
      cache: 'force-cache',
      headers: {
        'Accept': 'image/*',
      }
    };
  }
  
  // Priority 4: Use title to consistently select same stock image
  const index = hashString(item.title || item.sidequest?.title || item.id) % SIDEQUEST_STOCK_IMAGES.length;
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
  onRemove?: () => void; // For removing from space
  showRemoveButton?: boolean; // Whether to show the remove button
}

export default function SidequestCard({ item, spaceName, onPress, onRemove, showRemoveButton = false }: SidequestCardProps) {
  const sidequestTitle = item.sidequest?.title || item.title || 'Untitled Sidequest';
  const displaySpaceName = spaceName || 'Unknown Space';
  
  return (
    <TouchableOpacity style={styles.listingCard} onPress={onPress} activeOpacity={0.7}>
      {/* Main Image */}
      <View style={styles.imageContainer}>
        <Image 
          source={getSidequestImageSource(item)} 
          style={styles.listingImage} 
          resizeMode="cover"
          onError={(error) => {
            console.log('[SidequestCard] Image load error, falling back to stock image');
          }}
          onLoad={() => {
            console.log('[SidequestCard] Image loaded successfully');
          }}
          defaultSource={SIDEQUEST_STOCK_IMAGES[0]}
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
        
        {/* Remove Button */}
        {showRemoveButton && onRemove && (
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={(e) => {
              e.stopPropagation(); // Prevent card onPress
              onRemove();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
            <Text style={styles.removeButtonText}>Remove from Space</Text>
          </TouchableOpacity>
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
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  removeButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    marginLeft: Spacing.xs,
    fontWeight: Typography.fontWeight.medium,
  },
});
