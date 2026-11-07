// src/components/Card.js

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../theme';

export default function Card({ children, style, shadow = 'sm' }) {
  return (
    <View style={[styles.card, SHADOW[shadow] || {}, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
