import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { COLORS, SHADOWS } from '../../constants/theme';
import { ChildProfile } from '../../types/models';

interface ChildSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
  onAddChild: () => void;
}

export const ChildSwitcherModal: React.FC<ChildSwitcherModalProps> = ({
  visible,
  onClose,
  onAddChild,
}) => {
  const { children, activeChildId, setActiveChildId } = useAuthStore();

  const handleSelectChild = async (child: ChildProfile) => {
    await setActiveChildId(child.id);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <View style={styles.sheetContainer}>
          <View style={styles.indicator} />

          <View style={styles.header}>
            <Text style={styles.title}>Switch Child Profile</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {children.map((child) => {
              const isActive = child.id === activeChildId;
              return (
                <TouchableOpacity
                  key={child.id}
                  style={[styles.childCard, isActive && styles.activeChildCard]}
                  onPress={() => handleSelectChild(child)}
                  activeOpacity={0.8}
                >
                  <View style={styles.avatarContainer}>
                    <Image
                      source={require('../../../assets/images/mascot/fox.png')}
                      style={styles.avatarImage}
                    />
                  </View>

                  <View style={styles.childInfo}>
                    <Text style={styles.childName}>{child.display_name}</Text>
                    <Text style={styles.childMeta}>
                      ⭐ Level {child.level} • 🔥 {child.current_streak}-Day Streak
                    </Text>
                  </View>

                  {isActive && (
                    <View style={styles.activeCheckmark}>
                      <Text style={styles.checkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.addChildButton}
              onPress={() => {
                onClose();
                onAddChild();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.addIcon}>＋</Text>
              <Text style={styles.addText}>Add Another Child Profile</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: '70%',
    ...SHADOWS.medium,
  },
  indicator: {
    width: 44,
    height: 5,
    backgroundColor: COLORS.gray300,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 18,
    color: COLORS.textLight,
  },
  list: {
    marginBottom: 10,
  },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: COLORS.progressCardBg,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  activeChildCard: {
    borderColor: COLORS.primaryYellow,
    backgroundColor: '#FFFDF9',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  childMeta: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  activeCheckmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryYellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  checkText: {
    color: COLORS.textDark,
    fontWeight: '700',
    fontSize: 14,
  },
  addChildButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.textLight,
    marginTop: 8,
  },
  addIcon: {
    fontSize: 18,
    color: COLORS.textDark,
    marginRight: 8,
    fontWeight: '700',
  },
  addText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textDark,
  },
});
