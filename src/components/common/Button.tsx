import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, SHADOWS } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'coral' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const getContainerStyle = () => {
    const base: ViewStyle[] = [styles.button];

    // Variant style
    if (variant === 'primary') {
      base.push(styles.primaryButton, SHADOWS.primaryButton);
    } else if (variant === 'coral') {
      base.push(styles.coralButton, SHADOWS.coralButton);
    } else if (variant === 'secondary') {
      base.push(styles.secondaryButton);
    } else if (variant === 'outline') {
      base.push(styles.outlineButton);
    }

    // Size style
    if (size === 'small') {
      base.push(styles.smallButton);
    } else if (size === 'medium') {
      base.push(styles.mediumButton);
    } else {
      base.push(styles.largeButton);
    }

    if (disabled) {
      base.push(styles.disabledButton);
    }

    return base;
  };

  const getTextStyle = () => {
    const base: TextStyle[] = [styles.buttonText];

    if (variant === 'primary') {
      base.push(styles.primaryButtonText);
    } else if (variant === 'coral') {
      base.push(styles.coralButtonText);
    } else if (variant === 'secondary') {
      base.push(styles.secondaryButtonText);
    } else if (variant === 'outline') {
      base.push(styles.outlineButtonText);
    }

    if (size === 'small') {
      base.push(styles.smallButtonText);
    }

    if (disabled) {
      base.push(styles.disabledButtonText);
    }

    return base;
  };

  return (
    <TouchableOpacity
      style={[getContainerStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? COLORS.primaryYellow : COLORS.textDark}
        />
      ) : (
        <>
          {icon}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: COLORS.primaryYellow,
  },
  coralButton: {
    backgroundColor: COLORS.primaryCoral,
  },
  secondaryButton: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primaryYellow,
  },
  smallButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  mediumButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  largeButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: COLORS.gray200,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  primaryButtonText: {
    color: COLORS.textDark,
  },
  coralButtonText: {
    color: COLORS.white,
  },
  secondaryButtonText: {
    color: COLORS.textDark,
  },
  outlineButtonText: {
    color: COLORS.primaryYellow,
  },
  smallButtonText: {
    fontSize: 14,
  },
  disabledButtonText: {
    color: COLORS.textLight,
  },
});
