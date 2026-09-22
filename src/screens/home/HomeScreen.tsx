import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  StatusBar,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CurrentReadingCard } from '../../components/home/CurrentReadingCard';
import { COLORS } from '../../constants/theme';

export const HomeScreen = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={COLORS.white} 
        translucent={Platform.OS === 'android'}
      />

      {/* Кастомный Header с точным динамическим отступом под StatusBar */}
      <View 
        style={[
          styles.header, 
          { paddingTop: insets.top + (Platform.OS === 'android' ? 8 : 4) }
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
          <View style={styles.avatarPlaceholder} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Уровень */}
        <View style={styles.levelBadge}>
          <Text style={styles.levelBadgeText}>⭐ Level 3 Adventurer</Text>
        </View>

        {/* Приветствие */}
        <Text style={styles.greetingTitle}>Hi Leo, ready for reading time?</Text>
        <Text style={styles.greetingSubtitle}>
          Foxy is excited to explore new chapters with you today!
        </Text>

        {/* Маскот (Лисёнок) */}
        <View style={styles.mascotContainer}>
          <Image 
            source={require('../../../assets/images/mascot/fox.png')} 
            style={styles.mascotImage} 
          />
        </View>

        {/* Карточка текущей книги */}
        <CurrentReadingCard />

        {/* Главная кнопка */}
        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8}>
          <Text style={styles.primaryButtonText}>Start Reading Session</Text>
        </TouchableOpacity>

        {/* Статистика за сегодня */}
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Text style={styles.statIcon}>🪙</Text>
          </View>
          <View>
            <Text style={styles.statValue}>18 min</Text>
            <Text style={styles.statLabel}>Today's Reading</Text>
          </View>
        </View>

      </ScrollView>
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
    backgroundColor: '#E0E0E0',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.primaryYellow,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
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