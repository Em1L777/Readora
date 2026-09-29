import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { COLORS, SHADOWS } from '../../constants/theme';

interface RestEyesModalProps {
  visible: boolean;
  onClose: () => void;
}

export const RestEyesModal: React.FC<RestEyesModalProps> = ({ visible, onClose }) => {
  const [secondsLeft, setSecondsLeft] = useState(20);

  useEffect(() => {
    let interval: any;
    if (visible) {
      setSecondsLeft(20);
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Image
            source={require('../../../assets/images/mascot/fox.png')}
            style={styles.mascotImage}
          />

          <Text style={styles.title}>Rest Your Eyes! 🌿</Text>
          <Text style={styles.ruleBadge}>20-20-20 Rule</Text>

          <Text style={styles.description}>
            Look at an object at least 20 feet (6 meters) away for 20 seconds to keep
            your eyes healthy and relaxed!
          </Text>

          <View style={styles.timerCircle}>
            <Text style={styles.timerNumber}>{secondsLeft}</Text>
            <Text style={styles.timerSec}>sec</Text>
          </View>

          <TouchableOpacity
            style={styles.doneBtn}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.doneBtnText}>
              {secondsLeft === 0 ? 'Ready to Read Again! ✨' : 'Skip & Resume'}
            </Text>
          </TouchableOpacity>
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
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  mascotImage: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  ruleBadge: {
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 14,
  },
  description: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  timerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.progressCardBg,
    borderWidth: 3,
    borderColor: COLORS.primaryYellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  timerNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  timerSec: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  doneBtn: {
    backgroundColor: COLORS.darkBlue,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 28,
    width: '100%',
    alignItems: 'center',
  },
  doneBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
