import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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
import Animated, { 
  FadeInDown, 
  FadeInRight, 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring 
} from 'react-native-reanimated';
import { BorderRadius, Colors, Spacing, Typography } from '../../constants/theme';

type MapQuest = {
  id: string;
  title: string;
  host: string;
  when: string;
  location: string;
  distance: string;
  attendees: number;
  top: string;
  left: string;
  category: 'adventure' | 'learning' | 'creative' | 'social';
  image: any;
  isOnline: boolean;
};

const MAP_QUESTS: MapQuest[] = [
  {
    id: 'm1',
    title: 'Arisa',
    host: 'Arisa',
    when: 'Online',
    location: '1 mi',
    distance: '1 mi',
    attendees: 12,
    top: '34%',
    left: '52%',
    category: 'adventure',
    image: require('../../assets/images/sidequest_stock_images/sky1.png'),
    isOnline: true,
  },
  {
    id: 'm2',
    title: 'Annie',
    host: 'Annie',
    when: '12 mi',
    location: '12 mi',
    distance: '12 mi',
    attendees: 7,
    top: '29%',
    left: '36%',
    category: 'creative',
    image: require('../../assets/images/sidequest_stock_images/ski1.png'),
    isOnline: true,
  },
  {
    id: 'm3',
    title: 'Anginae',
    host: 'Anginae',
    when: '7 mi',
    location: '7 mi',
    distance: '7 mi',
    attendees: 15,
    top: '45%',
    left: '64%',
    category: 'learning',
    image: require('../../assets/images/sidequest_stock_images/snow2.png'),
    isOnline: true,
  },
  {
    id: 'm4',
    title: 'Rina',
    host: 'Rina',
    when: '3 mi',
    location: '3 mi',
    distance: '3.4 mi',
    attendees: 20,
    top: '55%',
    left: '44%',
    category: 'social',
    image: require('../../assets/images/sidequest_stock_images/beach2.png'),
    isOnline: false,
  },
];

const FILTERS: { id: 'all' | MapQuest['category']; label: string; icon: string }[] = [
  { id: 'all', label: 'Filter', icon: 'options-outline' },
  { id: 'learning', label: 'Studying Abroad', icon: 'book-outline' },
  { id: 'adventure', label: 'Backpacking', icon: 'map-outline' },
  { id: 'creative', label: 'Digital Nomad', icon: 'laptop-outline' },
];

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState('Columbus, United States');
  const [selectedFilter, setSelectedFilter] = useState<(typeof FILTERS)[number]['id']>('learning');
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);

  const filteredQuests = useMemo(() => {
    // For demo purposes, we return all, but in real app we'd filter
    return MAP_QUESTS;
  }, [searchQuery, selectedFilter]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F3F5F8', '#E8ECF1']} style={styles.mapArea}>
        <SafeAreaView style={styles.safeTop}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#111827" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              placeholder="Search city..."
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
            {FILTERS.map((filter, index) => {
              const active = selectedFilter === filter.id;
              return (
                <TouchableOpacity
                  key={filter.id}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setSelectedFilter(filter.id)}
                >
                  {filter.icon && (
                    <Ionicons 
                      name={filter.icon as any} 
                      size={16} 
                      color={active ? '#111827' : '#111827'} 
                      style={{ marginRight: 4 }}
                    />
                  )}
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{filter.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>

        <View style={styles.mapDecorLayer}>
          <View style={[styles.mapRoad, { top: '18%', left: '-10%', width: '125%', transform: [{ rotate: '10deg' }] }]} />
          <View style={[styles.mapRoad, { top: '42%', left: '-4%', width: '122%', transform: [{ rotate: '-14deg' }] }]} />
          <View style={[styles.mapRoad, { top: '65%', left: '-8%', width: '125%', transform: [{ rotate: '5deg' }] }]} />
        </View>

        {filteredQuests.map((quest, index) => {
          const isActive = selectedQuestId === quest.id;
          return (
            <Animated.View 
              key={quest.id}
              entering={FadeInDown.delay(index * 100).springify()}
              style={{ position: 'absolute', top: quest.top, left: quest.left }}
            >
              <TouchableOpacity
                style={[styles.pinWrap, isActive && styles.pinWrapActive]}
                onPress={() => setSelectedQuestId(quest.id)}
                activeOpacity={0.9}
              >
                <Image source={quest.image} style={styles.pinImage} />
                {quest.isOnline && <View style={styles.pinOnlineDot} />}
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* User Location Pulse */}
        <View style={[styles.userLocationPulse, { top: '35%', left: '48%' }]}>
           <View style={styles.userLocationDot} />
           <LinearGradient
             colors={['rgba(29, 115, 234, 0.3)', 'rgba(29, 115, 234, 0)']}
             style={styles.userLocationRing}
           />
        </View>
      </LinearGradient>

      <Animated.View entering={FadeInDown.springify()} style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />
        
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>102 Nearby Travelers</Text>
          <TouchableOpacity>
            <Text style={styles.sheetLink}>See All &gt;</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollCards}>
          {filteredQuests.map((quest, index) => {
            return (
              <AnimatedTouchableOpacity
                key={quest.id}
                entering={FadeInRight.delay(index * 100).springify()}
                style={styles.travelerCard}
                onPress={() => setSelectedQuestId(quest.id)}
              >
                <Image source={quest.image} style={styles.travelerImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.travelerOverlay}
                />
                <View style={styles.travelerInfo}>
                   <View style={styles.travelerNameRow}>
                     <Text style={styles.travelerName}>{quest.title}</Text>
                     {quest.isOnline && <View style={styles.onlineIndicator} />}
                   </View>
                   <Text style={styles.travelerDistance}>{quest.distance}</Text>
                </View>
              </AnimatedTouchableOpacity>
            );
          })}
        </ScrollView>
        
        <TouchableOpacity style={styles.largeButton}>
          <Text style={styles.largeButtonText}>See all 102 Nearby Travelers</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECEFF3',
  },
  mapArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  safeTop: {
    zIndex: 5,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  filtersRow: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipActive: {
    backgroundColor: '#FFFFFF', 
    borderWidth: 2,
    borderColor: '#1D73EA',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  filterChipTextActive: {
    color: '#111827',
  },
  mapDecorLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
  mapRoad: {
    position: 'absolute',
    height: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
  },
  pinWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#FFFFFF', // Green ring
    overflow: 'visible', // allow dot to overflow if needed, but image is clipped
    backgroundColor: '#FFFFFF',
    transform: [{ translateX: -30 }, { translateY: -30 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  pinWrapActive: {
    width: 80,
    height: 80,
    borderRadius: 40,
    transform: [{ translateX: -40 }, { translateY: -40 }],
    borderColor: '#1D73EA',
    borderWidth: 4,
    zIndex: 100,
  },
  pinImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  pinOnlineDot: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2ECC71',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 2,
  },
  userLocationPulse: {
    position: 'absolute',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  userLocationDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1D73EA',
    zIndex: 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userLocationRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing['4xl'],
    paddingHorizontal: Spacing.lg,
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: Spacing.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    fontSize: 20,
    color: '#111827',
    fontWeight: '800',
  },
  sheetLink: {
    fontSize: 14,
    color: '#1D73EA',
    fontWeight: '700',
  },
  scrollCards: {
    gap: 12,
    paddingBottom: Spacing.lg,
  },
  travelerCard: {
    width: 120,
    height: 160,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  travelerImage: {
    width: '100%',
    height: '100%',
  },
  travelerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  travelerInfo: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  travelerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  travelerName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2ECC71',
  },
  travelerDistance: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  largeButton: {
    backgroundColor: '#3B82F6',
    borderRadius: BorderRadius.full,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  largeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
