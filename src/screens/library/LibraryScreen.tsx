import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

export const LibraryScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Library Screen</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  text: { fontSize: 18, color: COLORS.textDark, fontWeight: '600' }
});