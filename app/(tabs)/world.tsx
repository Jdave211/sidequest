import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { BorderRadius, Colors, Spacing, Typography } from '../../constants/theme';

type DiscoveryScope = 'near' | 'far';

type DiscoveryCard = {
  id: string;
  title: string;
  host: string;
  location: string;
  when: string;
  distance: string;
  scope: DiscoveryScope;
  interested: number;
  image: any;
};

const DISCOVERY_CARDS: DiscoveryCard[] = [
  {
    id: 'w1',
    title: 'Sunrise kayak and coffee run',
    host: 'Maya',
    location: 'Scioto Mile, Columbus',
    when: 'Today 6:30 AM',
    distance: '1.4 mi',
    scope: 'near',
    interested: 14,
    image: require('../../assets/images/sidequest_stock_images/beach1.jpg'),
  },
  {
    id: 'w2',
    title: 'Indoor skydiving first timer session',
    host: 'Andre',
    location: 'I Fly, Polaris',
    when: 'Sat 2:00 PM',
    distance: '8.0 mi',
    scope: 'near',
    interested: 22,
    image: require('../../assets/images/sidequest_stock_images/sky1.png'),
  },
  {
    id: 'w3',
    title: 'Street photo walk and editing meetup',
    host: 'Lea',
    location: 'Short North, Columbus',
    when: 'Sun 11:00 AM',
    distance: '3.6 mi',
    scope: 'near',
    interested: 9,
    image: require('../../assets/images/sidequest_stock_images/ski1.png'),
  },
  {
    id: 'w4',
    title: 'Desert stars roadtrip sidequest',
    host: 'Noah',
    location: 'Moab, Utah',
    when: 'Mar 14 - Mar 17',
    distance: '1550 mi',
    scope: 'far',
    interested: 51,
    image: require('../../assets/images/sidequest_stock_images/snow1.png'),
  },
  {
    id: 'w5',
    title: 'Night market food crawl squad',
    host: 'Aya',
    location: 'Tokyo, Japan',
    when: 'Apr 5 8:00 PM',
    distance: '6400 mi',
    scope: 'far',
    interested: 76,
    image: require('../../assets/images/sidequest_stock_images/sky2.png'),
  },
];

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function World() {
  const [scope, setScope] = useState<DiscoveryScope>('near');
  const [query, setQuery] = useState('');

  const cards = useMemo(() => {
    const search = query.trim().toLowerCase();
    return DISCOVERY_CARDS.filter((item) => {
      const byScope = item.scope === scope;
      if (!search) return byScope;
      return byScope && `${item.title} ${item.location}`.toLowerCase().includes(search);
    });
  }, [scope, query]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>World</Text>
              <Text style={styles.subtitle}>Explore what's happening globally.</Text>
            </View>
            <TouchableOpacity style={styles.plusButton} onPress={() => router.push('/add-sidequest' as any)}>
              <Ionicons name="add" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              style={styles.searchInput}
              placeholder="Search destination or activity"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <View style={styles.segment}>
            <TouchableOpacity
              style={[styles.segmentItem, scope === 'near' && styles.segmentItemActive]}
              onPress={() => setScope('near')}
            >
              <Text style={[styles.segmentLabel, scope === 'near' && styles.segmentLabelActive]}>Near You</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentItem, scope === 'far' && styles.segmentItemActive]}
              onPress={() => setScope('far')}
            >
              <Text style={[styles.segmentLabel, scope === 'far' && styles.segmentLabelActive]}>Far Away</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {cards.map((card, index) => (
          <Animated.View key={card.id} entering={FadeInDown.delay(400 + index * 100).springify()}>
            <TouchableOpacity style={styles.card} activeOpacity={0.95}>
              <Image source={card.image} style={styles.cardImage} />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.cardOverlay}
              />
              <View style={styles.cardBody}>
                <View style={styles.cardTopLine}>
                  <View style={styles.badge}>
                    <Ionicons name="location" size={12} color="#FFFFFF" />
                    <Text style={styles.badgeText}>{card.distance}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                     <Text style={styles.badgeText}>{card.interested} interested</Text>
                  </View>
                </View>
                
                <Text style={styles.cardTitle}>{card.title}</Text>
                
                <View style={styles.cardMetaRow}>
                  <Ionicons name="calendar-outline" size={14} color="#D1D5DB" />
                  <Text style={styles.cardMeta}>{card.when}</Text>
                </View>
                
                <View style={styles.cardMetaRow}>
                  <Ionicons name="person-outline" size={14} color="#D1D5DB" />
                  <Text style={styles.cardMeta}>Hosted by {card.host}</Text>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.secondaryAction}>
                    <Text style={styles.secondaryActionText}>Follow</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryAction}>
                    <Text style={styles.primaryActionText}>Join</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  plusButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1D73EA',
    shadowColor: '#1D73EA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: BorderRadius.full,
    padding: 4,
  },
  segmentItem: {
    flex: 1,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    paddingVertical: 10,
  },
  segmentItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  segmentLabelActive: {
    color: '#111827',
    fontWeight: '700',
  },
  card: {
    height: 280,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    position: 'relative',
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  cardBody: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: Spacing.lg,
  },
  cardTopLine: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backdropFilter: 'blur(10px)', 
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cardMeta: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '600',
  },
  cardActions: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  secondaryAction: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  secondaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryAction: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: '#1D73EA',
    alignItems: 'center',
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
