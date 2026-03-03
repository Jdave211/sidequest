import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { 
  FadeInDown, 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring 
} from 'react-native-reanimated';
import { BorderRadius, Colors, Spacing, Typography } from '../../constants/theme';

type Plan = {
  id: string;
  city: string;
  dateRange: string;
  title: string;
  status: string;
  members: number;
  image: any;
  participants: any[];
};

const UPCOMING_PLANS: Plan[] = [
  {
    id: 'p1',
    city: 'Columbus',
    dateRange: 'FEB 12 - FEB 19',
    title: 'Indoor skydiving and ramen run',
    status: 'Happening Now',
    members: 4,
    image: require('../../assets/images/sidequest_stock_images/sky2.png'),
    participants: [
      require('../../assets/images/sidequest_stock_images/beach2.png'),
      require('../../assets/images/sidequest_stock_images/ski1.png'),
    ]
  },
  {
    id: 'p2',
    city: 'Cincinnati',
    dateRange: 'MAR 01',
    title: 'Street art crawl and photo challenge',
    status: 'Open for join requests',
    members: 9,
    image: require('../../assets/images/sidequest_stock_images/beach2.png'),
    participants: []
  },
];

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function MySidequests() {
  const featured = UPCOMING_PLANS[0];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const onPressIn = () => {
    scale.value = withSpring(0.98);
  };

  const onPressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>My Trips</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => router.push('/add-sidequest' as any)}>
              <Ionicons name="add" size={30} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Trips</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All &gt;</Text>
            </TouchableOpacity>
          </View>

          <AnimatedTouchableOpacity 
            style={[styles.featuredCard, animatedStyle]}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            activeOpacity={1}
          >
            <Image source={featured.image} style={styles.featuredImage} />
            <LinearGradient
              colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)']}
              style={styles.featuredOverlay}
            />
            
            <View style={styles.featuredContent}>
              <View style={styles.featuredTopRow}>
                <View style={styles.flagRow}>
                  <Text style={styles.flagEmoji}>🇺🇸</Text>
                  <Text style={styles.featuredCity}>{featured.city}</Text>
                </View>
                <Text style={styles.featuredDate}>{featured.dateRange}</Text>
              </View>

              <View style={styles.participantsRow}>
                <View style={styles.avatarStack}>
                  {featured.participants.map((p, i) => (
                    <Image key={i} source={p} style={[styles.participantAvatar, { marginLeft: i > 0 ? -12 : 0, zIndex: 10 - i }]} />
                  ))}
                  <View style={[styles.participantAvatar, styles.moreAvatar, { marginLeft: -12, zIndex: 0 }]}>
                    <Text style={styles.moreAvatarText}>+2</Text>
                  </View>
                </View>
              </View>
            </View>
          </AnimatedTouchableOpacity>

          <View style={styles.statusContainer}>
            <Ionicons name="airplane" size={16} color="#8A93A4" />
            <Text style={styles.statusText}>{featured.status}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Columbus Groups 🇺🇸</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All &gt;</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>It's quiet now...</Text>
            <Text style={styles.emptySubtitle}>
              Create the first group now 🎉
            </Text>
            <TouchableOpacity style={styles.outlineButton}>
              <Ionicons name="add" size={18} color="#1D73EA" />
              <Text style={styles.outlineButtonText}>Add new group</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Travelers Going</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All &gt;</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.emptyStateContainer}>
             <Text style={styles.emptyTitle}>No one is going yet...</Text>
             <Text style={styles.emptySubtitle}>You'll be notified when someone joins the trip 💬</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
    gap: Spacing.lg,
  },
  headerRow: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 28,
    color: '#000000',
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D73EA',
    shadowColor: '#1D73EA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  seeAllText: {
    color: '#1D73EA',
    fontSize: 14,
    fontWeight: '600',
  },
  featuredCard: {
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F0F2F5',
  },
  featuredImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredContent: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
  featuredTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flagEmoji: {
    fontSize: 20,
  },
  featuredCity: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  featuredDate: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.9,
    marginTop: 6,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  moreAvatar: {
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.sm,
  },
  statusText: {
    fontSize: 14,
    color: '#8A93A4',
    fontWeight: '500',
  },
  emptyCard: {
    paddingVertical: Spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    color: '#111827',
    fontWeight: '700',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8A93A4',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: '#1D73EA',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
  },
  outlineButtonText: {
    color: '#1D73EA',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyStateContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
});




