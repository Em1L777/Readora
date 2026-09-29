import React from 'react';
import { View, Text, Modal, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { LogReadingSessionResult } from '../../types/database.types';
import { Button } from '../common/Button';
import { COLORS, SHADOWS } from '../../constants/theme';

interface LevelUpModalProps {
  visible: boolean;
  result: LogReadingSessionResult | null;
  onClose: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  visible,
  result,
  onClose,
}) => {
  if (!result) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Image
            source={require('../../../assets/images/mascot/fox.png')}
            style={styles.mascotImage}
          />

          {result.level_up ? (
            <View style={styles.badgeBanner}>
              <Text style={styles.badgeBannerText}>⭐ LEVEL UP!</Text>
            </View>
          ) : (
            <View style={[styles.badgeBanner, styles.successBanner]}>
              <Text style={[styles.badgeBannerText, styles.successBannerText]}>
                🎉 SESSION COMPLETE!
              </Text>
            </View>
          )}

          <Text style={styles.title}>
            {result.level_up
              ? `Level ${result.new_level} Adventurer!`
              : 'Great Reading Session!'}
          </Text>

          <Text style={styles.subtitle}>
            {result.level_up
              ? "You've unlocked higher reading mastery and gained new gear!"
              : 'Your pages and reading time have been safely recorded.'}
          </Text>

          {/* Metrics Grid */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricIcon}>⭐</Text>
              <Text style={styles.metricValue}>+{result.xp_earned}</Text>
              <Text style={styles.metricLabel}>XP Earned</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricIcon}>📖</Text>
              <Text style={styles.metricValue}>+{result.pages_read}</Text>
              <Text style={styles.metricLabel}>Pages Read</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricIcon}>🔥</Text>
              <Text style={styles.metricValue}>{result.current_streak}</Text>
              <Text style={styles.metricLabel}>Day Streak</Text>
            </View>
          </View>

          {result.book_completed && (
            <View style={styles.completedBanner}>
              <Text style={styles.completedBannerText}>
                🏆 Book Completed! (+100 XP Bonus Awarded)
              </Text>
            </View>
          )}

          <Button
            title="Claim Rewards & Continue ✨"
            onPress={onClose}
            style={styles.actionBtn}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  mascotImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  badgeBanner: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 10,
  },
  badgeBannerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.5,
  },
  successBanner: {
    backgroundColor: '#E8F5E9',
  },
  successBannerText: {
    color: '#2E7D32',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    gap: 8,
  },
  metricItem: {
    flex: 1,
    backgroundColor: COLORS.progressCardBg,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  metricIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  completedBanner: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 18,
    width: '100%',
  },
  completedBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
    textAlign: 'center',
  },
  actionBtn: {
    width: '100%',
  },
});
