import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '../../constants/theme';

interface CircularProgressTimerProps {
  elapsedSeconds: number;
  goalMinutes: number;
  size?: number;
  strokeWidth?: number;
}

export const CircularProgressTimer: React.FC<CircularProgressTimerProps> = ({
  elapsedSeconds,
  goalMinutes,
  size = 260,
  strokeWidth = 14,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const goalSeconds = Math.max(1, goalMinutes * 60);
  const progressRatio = Math.min(1, elapsedSeconds / goalSeconds);
  const strokeDashoffset = circumference - progressRatio * circumference;

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formattedElapsed = formatTime(elapsedSeconds);
  const formattedGoal = `${goalMinutes.toString().padStart(2, '0')}:00`;

  return (
    <View style={styles.container}>
      <View style={[styles.svgWrapper, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          {/* Background Track */}
          <Circle
            stroke={COLORS.progressTrack}
            fill="transparent"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          {/* Progress Arc */}
          <Circle
            stroke={COLORS.primaryYellow}
            fill="transparent"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>

        {/* Mascot Center View */}
        <View style={styles.centerContent}>
          <Image
            source={require('../../../assets/images/mascot/fox.png')}
            style={styles.mascotImage}
          />
        </View>
      </View>

      {/* Time Elapsed / Goal Display */}
      <View style={styles.timeTextContainer}>
        <Text style={styles.timeValue}>
          {formattedElapsed} <Text style={styles.timeGoal}>/ {formattedGoal}</Text>
        </Text>
        <Text style={styles.timeLabel}>SESSION TIME ELAPSED</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  svgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotImage: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
  },
  timeTextContainer: {
    alignItems: 'center',
    marginTop: 14,
  },
  timeValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  timeGoal: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textLight,
    letterSpacing: 0.8,
    marginTop: 4,
  },
});
