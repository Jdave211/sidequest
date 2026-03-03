import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from 'react-native';
import Animated, { FadeInDown, Layout, SlideInRight } from 'react-native-reanimated';
import { BorderRadius, Spacing, Typography } from '../../constants/theme';

type ThreadType = 'all' | 'dms' | 'plans';

type Thread = {
  id: string;
  name: string;
  preview: string;
  time: string;
  unread: number;
  type: ThreadType;
  avatarColor: string;
};

const THREADS: Thread[] = [
  {
    id: 't1',
    name: 'Andre',
    preview: 'I posted indoor skydiving details in the plan.',
    time: '2m',
    unread: 2,
    type: 'dms',
    avatarColor: '#DCE8FA',
  },
  {
    id: 't2',
    name: 'Skydiving Group',
    preview: '3 new join requests waiting for approval.',
    time: '9m',
    unread: 1,
    type: 'plans',
    avatarColor: '#FAE8E8',
  },
  {
    id: 't3',
    name: 'Local Sidequest Crew',
    preview: 'Who can host next Saturday?',
    time: '1h',
    unread: 0,
    type: 'plans',
    avatarColor: '#E8FAE9',
  },
  {
    id: 't4',
    name: 'Maya',
    preview: 'Can I follow your travel sidequests?',
    time: '3h',
    unread: 0,
    type: 'dms',
    avatarColor: '#FAF5E8',
  },
];

const FILTERS: { id: ThreadType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'dms', label: 'DMs' },
  { id: 'plans', label: 'Plans' },
];

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function Social() {
  const [activeFilter, setActiveFilter] = useState<ThreadType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const visibleThreads = useMemo(() => {
    let threads = activeFilter === 'all' 
      ? THREADS 
      : THREADS.filter((thread) => thread.type === activeFilter);

    if (searchQuery) {
      threads = threads.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.preview.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return threads;
  }, [activeFilter, searchQuery]);

  const requestCount = 0;

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Chats</Text>
          <TouchableOpacity style={styles.requestsButton}>
            <Text style={styles.requestsButtonText}>{requestCount} Requests</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
           <Ionicons name="search" size={24} color="#111827" />
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.panel}>
        <View style={styles.segmentContainer}>
          {FILTERS.map((filter) => {
            const active = activeFilter === filter.id;
            return (
              <TouchableOpacity
                key={filter.id}
                style={[styles.segmentItem, active && styles.segmentItemActive]}
                onPress={() => setActiveFilter(filter.id)}
              >
                <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{filter.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView style={styles.threadList} showsVerticalScrollIndicator={false}>
          {visibleThreads.map((thread, index) => (
            <AnimatedTouchableOpacity 
              key={thread.id} 
              entering={FadeInDown.delay(index * 100).springify()}
              layout={Layout.springify()}
              style={styles.threadRow}
            >
              <View style={[styles.avatar, { backgroundColor: thread.avatarColor }]}>
                <Text style={styles.avatarText}>{thread.name.slice(0, 2).toUpperCase()}</Text>
              </View>
              <View style={styles.threadBody}>
                <View style={styles.threadHeaderLine}>
                  <Text style={styles.threadName}>{thread.name}</Text>
                  <Text style={styles.threadTime}>{thread.time}</Text>
                </View>
                <Text style={[styles.threadPreview, thread.unread > 0 && styles.threadPreviewUnread]} numberOfLines={1}>
                  {thread.preview}
                </Text>
              </View>
              {thread.unread > 0 && (
                <View style={styles.unreadDot} />
              )}
            </AnimatedTouchableOpacity>
          ))}

          {!visibleThreads.length && (
            <Animated.View entering={FadeInDown.delay(200)} style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No conversations found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search or filters.</Text>
            </Animated.View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  requestsButton: {
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  requestsButtonText: {
    color: '#1D73EA',
    fontWeight: '700',
    fontSize: 14,
  },
  panel: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius['2xl'],
    padding: 4,
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.xl,
  },
  segmentItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentLabel: {
    color: '#9CA3AF',
    fontWeight: '600',
    fontSize: 16,
  },
  segmentLabelActive: {
    color: '#111827',
    fontWeight: '700',
  },
  threadList: {
    flex: 1,
  },
  threadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    padding: Spacing.xs,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  threadBody: {
    flex: 1,
    justifyContent: 'center',
  },
  threadHeaderLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  threadName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  threadTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  threadPreview: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    lineHeight: 20,
  },
  threadPreviewUnread: {
    color: '#111827',
    fontWeight: '600',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1D73EA',
    marginLeft: Spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: Spacing['4xl'],
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
});
