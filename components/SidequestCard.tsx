import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BackgroundTextures, BorderRadius, Colors, Spacing, Typography } from '../constants/theme';

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
  const [showModal, setShowModal] = useState(false);

  const allImages: string[] = Array.isArray(item.image_urls) && item.image_urls.length > 0
    ? item.image_urls
    : (Array.isArray(item?.sidequest?.image_urls) ? item.sidequest.image_urls : []);

  const reviewText: string | undefined = item.review || item?.sidequest?.review;
  const locationText: string | undefined = item.location || item?.sidequest?.location;
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);
  const [showZoom, setShowZoom] = useState(false);
  const viewableRef = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0 && viewableItems[0].index != null) {
      setCarouselIndex(viewableItems[0].index);
    }
  });
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const handleShare = async () => {
    try {
      const message = `${sidequestTitle}${displaySpaceName ? ` • ${displaySpaceName}` : ''}`;
      await Share.share({ message });
    } catch {}
  };
  
  return (
    <>
    <TouchableOpacity style={styles.listingCard} onPress={onPress || (() => setShowModal(true))} activeOpacity={0.7}>
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
        {/* Subtle paper texture only on the white content area */}
        <View style={[StyleSheet.absoluteFillObject, styles.contentTexture]} pointerEvents="none" />
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
    {/* Detail Modal */}
    <Modal visible={showModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <BlurView intensity={25} tint="light" style={StyleSheet.absoluteFillObject} />
        <View style={[StyleSheet.absoluteFillObject, styles.overlayTexture]} />
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setShowModal(false)} />
        <View style={styles.modalCenterWrapper}>
          <View style={styles.modalCard} onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>{sidequestTitle}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Content scroll */}
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Media carousel */}
              {allImages.length > 0 ? (
                <View>
                  <FlatList
                    data={allImages}
                    keyExtractor={(uri, idx) => `${uri}-${idx}`}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item: uri }) => (
                      <View style={{ width: Math.max(0, cardWidth - Spacing.lg * 2), alignSelf: 'center' }}>
                        <Image
                          source={{ uri, cache: 'force-cache', headers: { Accept: 'image/*' } }}
                          style={[styles.modalImage, { width: Math.max(0, cardWidth - Spacing.lg * 2) }]}
                          resizeMode="cover"
                        />
                      </View>
                    )}
                    onViewableItemsChanged={viewableRef.current}
                    viewabilityConfig={viewConfigRef.current}
                    style={{ width: Math.max(0, cardWidth - Spacing.lg * 2), alignSelf: 'center' }}
                  />
                  {/* Zoom control */}
                  <TouchableOpacity style={styles.zoomBtn} onPress={() => setShowZoom(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="expand-outline" size={16} color={Colors.textSecondary} style={{ opacity: 0.8 }} />
                  </TouchableOpacity>
                  <View style={styles.dotsRow}>
                    {allImages.map((_, i) => (
                      <View key={i} style={[styles.dot, i === carouselIndex && styles.dotActive]} />
                    ))}
                  </View>
                </View>
              ) : (
                <View style={styles.modalEmptyMedia}>
                  <Ionicons name="image-outline" size={36} color={Colors.textSecondary} />
                  <Text style={styles.modalEmptyText}>No media</Text>
                </View>
              )}

              {/* Review + Location row */}
              {(reviewText || locationText) ? (
                <View style={styles.infoRow}>
                  {reviewText ? (
                    <View style={[styles.reviewSection, styles.infoLeft]}>
                      <Text style={styles.sectionLabel}>Review</Text>
                      <Text style={styles.reviewText}>{reviewText}</Text>
                    </View>
                  ) : <View style={styles.infoLeft} />}
                  {locationText ? (
                    <View style={[styles.locationSection, styles.infoRight]}>
                      <Text style={styles.sectionLabel}>Location</Text>
                      <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
                        <Text style={styles.modalLocationText} numberOfLines={2}>{locationText}</Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </ScrollView>

            {/* Footer actions */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                <Ionicons name="share-outline" size={18} color={Colors.textPrimary} />
                <Text style={styles.shareBtnText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>

    {/* Fullscreen zoom modal */}
    <Modal visible={showZoom} transparent animationType="fade">
      <View style={styles.zoomOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setShowZoom(false)} />
        <View style={styles.zoomHeader}>
          <TouchableOpacity onPress={() => setShowZoom(false)} style={styles.zoomCloseBtn}>
            <Ionicons name="close" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.zoomContent}
          maximumZoomScale={3}
          minimumZoomScale={1}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          centerContent
        >
          {allImages[carouselIndex] ? (
            <Image
              source={{ uri: allImages[carouselIndex], cache: 'force-cache', headers: { Accept: 'image/*' } }}
              style={styles.zoomImage}
              resizeMode="contain"
            />
          ) : null}
        </ScrollView>
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Airbnb-style listing card
  listingCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    // Subtle card shadow/border
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  contentTexture: {
    ...BackgroundTextures.paper,
    opacity: 0.12,
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
    backgroundColor: '#FAF9F6',
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

  // Modal styles (liquid glass)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalCenterWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    width: '95%',
    maxWidth: 420,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
    paddingRight: Spacing.md,
  },
  modalScroll: {
    paddingHorizontal: Spacing.lg,
  },
  mediaColumn: {
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  modalImage: {
    width: '100%',
    height: 260,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  dotActive: {
    backgroundColor: Colors.textPrimary,
  },
  modalEmptyMedia: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  modalEmptyText: {
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
  },
  reviewSection: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  reviewText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeight.lg,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  shareBtnText: {
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  overlayTexture: {
    ...BackgroundTextures.paper,
    opacity: 0.35,
  },
  infoRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  infoLeft: {
    flex: 1,
  },
  infoRight: {
    width: 160,
  },
  locationSection: {
    paddingTop: Spacing.md,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  
  modalLocationText: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.lineHeight.base,
    flex: 1,
  },
  zoomBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  zoomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  zoomHeader: {
    position: 'absolute',
    top: Spacing.xl,
    right: Spacing.xl,
    zIndex: 2,
  },
  zoomCloseBtn: {
    padding: Spacing.sm,
  },
  zoomContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  zoomImage: {
    width: '100%',
    height: '100%',
  },
});
