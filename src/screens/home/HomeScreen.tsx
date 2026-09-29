import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { CurrentReadingCard } from '../../components/home/CurrentReadingCard';
import { ChildSwitcherModal } from '../../components/parent/ChildSwitcherModal';
import { useAuthStore } from '../../store/useAuthStore';
import { useBooksStore } from '../../store/useBooksStore';
import { readingService } from '../../services/reading.service';
import { COLORS } from '../../constants/theme';

export const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { getActiveChild } = useAuthStore();
  const { fetchBooks } = useBooksStore();
  const [showChildSwitcher, setShowChildSwitcher] = useState(false);
  const [todayMinutes, setTodayMinutes] = useState(0);

  const activeChild = getActiveChild();
  const childName = activeChild?.display_name || 'Adventurer';
  const childLevel = activeChild?.level || 1;

  React.useEffect(() => {
    if (activeChild?.id) {
      fetchBooks(activeChild.id);
      readingService
        .getChildAnalytics(activeChild.id)
        .then((data) => setTodayMinutes(data.todayMinutesRead))
        .catch((err) => console.error('Failed to load today analytics:', err));
    }
  }, [activeChild?.id]);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.white}
        translucent={Platform.OS === 'android'}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + (Platform.OS === 'android' ? 8 : 4) },
        ]}
      >
        <View style={styles.headerLeft}>
          <Image
            source={require('../../../assets/images/Readora-logo.png')}
            style={styles.logoImage}
          />
          <View>
            <Text style={styles.headerTitle}>Readora</Text>
            <Text style={styles.headerSubtitle}>Kid Home</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Image
            source={require('../../../assets/images/icons/Notification.png')}
            style={styles.notificationIcon}
          />
          <TouchableOpacity
            style={styles.avatarPlaceholder}
            onPress={() => setShowChildSwitcher(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.avatarInitial}>{childName[0]}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Level Badge */}
        <View style={styles.levelBadge}>
          <Text style={styles.levelBadgeText}>⭐ Level {childLevel} Adventurer</Text>
        </View>

        {/* Greeting */}
        <Text style={styles.greetingTitle}>Hi {childName}, ready for reading time?</Text>
        <Text style={styles.greetingSubtitle}>
          Foxy is excited to explore new chapters with you today!
        </Text>

        {/* Mascot */}
        <View style={styles.mascotContainer}>
          <Image
            source={require('../../../assets/images/mascot/fox.png')}
            style={styles.mascotImage}
          />
        </View>

        {/* Current Reading Book Card */}
        <CurrentReadingCard />

        {/* Start Reading Button */}
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('ReadingTimer')}
        >
          <Text style={styles.primaryButtonText}>Start Reading Session</Text>
        </TouchableOpacity>

        {/* Today's Stats */}
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Text style={styles.statIcon}>🪙</Text>
          </View>
          <View>
            <Text style={styles.statValue}>{todayMinutes} min</Text>
            <Text style={styles.statLabel}>Today's Reading</Text>
          </View>
        </View>
      </ScrollView>

      {/* Child Switcher Modal */}
      <ChildSwitcherModal
        visible={showChildSwitcher}
        onClose={() => setShowChildSwitcher(false)}
        onAddChild={() => navigation.navigate('CreateChild', { isFirstChild: false })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 36,
    height: 36,
    marginRight: 12,
    resizeMode: 'contain',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textDark,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIcon: {
    width: 22,
    height: 22,
    marginRight: 16,
    resizeMode: 'contain',
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    backgroundColor: COLORS.primaryYellow,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primaryYellow,
  },
  avatarInitial: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    backgroundColor: COLORS.background,
    flexGrow: 1,
  },
  levelBadge: {
    backgroundColor: COLORS.badgeBg,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  levelBadgeText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  greetingSubtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    lineHeight: 22,
  },
  mascotContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  mascotImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  primaryButton: {
    backgroundColor: COLORS.primaryYellow,
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: COLORS.primaryYellow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.progressCardBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statIcon: {
    fontSize: 18,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
});