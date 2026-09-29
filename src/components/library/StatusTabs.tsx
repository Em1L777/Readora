import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BookStatus } from '../../types/database.types';
import { COLORS } from '../../constants/theme';

interface StatusTabsProps {
  selectedStatus: BookStatus;
  onSelectStatus: (status: BookStatus) => void;
  counts: Record<BookStatus | 'all', number>;
}

export const StatusTabs: React.FC<StatusTabsProps> = ({
  selectedStatus,
  onSelectStatus,
  counts,
}) => {
  const tabs: { key: BookStatus; label: string; icon: string }[] = [
    { key: 'reading', label: 'Reading', icon: '📖' },
    { key: 'completed', label: 'Completed', icon: '🏆' },
    { key: 'dropped', label: 'On Hold', icon: '⏸️' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = selectedStatus === tab.key;
        const count = counts[tab.key] || 0;

        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={() => onSelectStatus(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
              {tab.label}
            </Text>
            <View style={[styles.countBadge, isActive && styles.activeCountBadge]}>
              <Text style={[styles.countText, isActive && styles.activeCountText]}>
                {count}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 6,
    borderRadius: 20,
    marginBottom: 20,
    gap: 6,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 15,
    backgroundColor: 'transparent',
    gap: 4,
  },
  activeTab: {
    backgroundColor: COLORS.darkBlue,
  },
  tabIcon: {
    fontSize: 13,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  activeTabLabel: {
    color: COLORS.white,
  },
  countBadge: {
    backgroundColor: COLORS.progressCardBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 2,
  },
  activeCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  activeCountText: {
    color: COLORS.white,
  },
});
