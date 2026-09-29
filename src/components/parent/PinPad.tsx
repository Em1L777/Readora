import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SHADOWS } from '../../constants/theme';

interface PinPadProps {
  title?: string;
  subtitle?: string;
  error?: string | null;
  onComplete: (pin: string) => void;
  onCancel?: () => void;
  style?: ViewStyle;
}

export const PinPad: React.FC<PinPadProps> = ({
  title = 'Parent Security PIN',
  subtitle = 'Enter 4-digit code to access Parent Area',
  error,
  onComplete,
  onCancel,
  style,
}) => {
  const [pin, setPin] = useState<string>('');

  useEffect(() => {
    if (pin.length === 4) {
      onComplete(pin);
      // Automatically reset if error occurs later
      const timer = setTimeout(() => {
        setPin('');
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [pin]);

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin((prev) => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    setPin('');
  };

  const renderKey = (val: string, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.key}
      onPress={() => handleKeyPress(val)}
      activeOpacity={0.6}
    >
      <Text style={styles.keyText}>{val}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.lockBadge}>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {/* 4 Dots Indicator */}
      <View style={styles.dotsContainer}>
        {[0, 1, 2, 3].map((idx) => {
          const isFilled = pin.length > idx;
          return (
            <View
              key={idx}
              style={[
                styles.dot,
                isFilled && styles.dotFilled,
                Boolean(error) && styles.dotError,
              ]}
            />
          );
        })}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Keypad Grid */}
      <View style={styles.keypad}>
        <View style={styles.row}>
          {['1', '2', '3'].map(renderKey)}
        </View>
        <View style={styles.row}>
          {['4', '5', '6'].map(renderKey)}
        </View>
        <View style={styles.row}>
          {['7', '8', '9'].map(renderKey)}
        </View>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.key, styles.auxKey]}
            onPress={handleClear}
            activeOpacity={0.6}
          >
            <Text style={styles.auxKeyText}>Clear</Text>
          </TouchableOpacity>

          {renderKey('0', 9)}

          <TouchableOpacity
            style={[styles.key, styles.auxKey]}
            onPress={handleDelete}
            activeOpacity={0.6}
          >
            <Text style={styles.deleteIcon}>⌫</Text>
          </TouchableOpacity>
        </View>
      </View>

      {onCancel && (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel & Go Back</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  lockBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.streakBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  lockIcon: {
    fontSize: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.inputBorder,
    backgroundColor: COLORS.white,
  },
  dotFilled: {
    backgroundColor: COLORS.primaryYellow,
    borderColor: COLORS.primaryYellow,
  },
  dotError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.streakBg,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  keypad: {
    width: '100%',
    maxWidth: 320,
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
  },
  key: {
    flex: 1,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.small,
  },
  keyText: {
    fontSize: 26,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  auxKey: {
    backgroundColor: COLORS.gray100,
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  auxKeyText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  deleteIcon: {
    fontSize: 22,
    color: COLORS.textDark,
  },
  cancelButton: {
    marginTop: 24,
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
  },
});
