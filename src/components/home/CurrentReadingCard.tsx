import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { COLORS } from '../../constants/theme'; // Убедись, что путь верный

export const CurrentReadingCard = () => {
  return (
    <View style={styles.cardContainer}>
      {/* Header карточки */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Current reading</Text>
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>5-Day Streak!</Text>
        </View>
      </View>

      {/* Информация о книге */}
      <View style={styles.bookInfoContainer}>
        {/* Placeholder для обложки книги. Замени source на require() когда будет ассет */}
        <View style={styles.bookCoverPlaceholder} />
        
        <View style={styles.bookDetails}>
          <Text style={styles.bookTitle}>The Little Prince</Text>
          <Text style={styles.bookAuthor}>Antoine de Saint-Exupéry</Text>
          
          <View style={styles.timeInfo}>
            <Text style={styles.timeIcon}>🕒</Text>
            <Text style={styles.timeText}>Est. 12 mins left today</Text>
          </View>
        </View>
      </View>

      {/* Блок прогресса */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.pageText}>📖 Page 42 of 96</Text>
          <Text style={styles.percentText}>44%</Text>
        </View>
        
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: '44%' }]} />
        </View>
        
        <Text style={styles.goalText}>Goal: 15 pages/day</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4, // Для Android
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textDark,
  },
  streakBadge: {
    backgroundColor: COLORS.streakBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  streakText: {
    color: COLORS.streakText,
    fontSize: 12,
    fontWeight: '600',
  },
  bookInfoContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  bookCoverPlaceholder: {
    width: 64,
    height: 96,
    backgroundColor: COLORS.textLight,
    borderRadius: 8,
    marginRight: 16,
  },
  bookDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 12,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  progressSection: {
    backgroundColor: COLORS.progressCardBg,
    borderRadius: 16,
    padding: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pageText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textDark,
  },
  percentText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryYellow,
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: COLORS.progressTrack,
    borderRadius: 5,
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primaryYellow,
    borderRadius: 5,
  },
  goalText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
});