// src/components/Button.js

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SIZES, RADIUS } from '../theme';

export default function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) {
  const isDisabled = disabled || loading;

  const bgColor = {
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    outline: 'transparent',
    ghost: 'transparent',
    success: COLORS.success,
    danger: COLORS.danger,
  }[variant] || COLORS.primary;

  const textColor = {
    primary: '#fff',
    secondary: '#fff',
    outline: COLORS.primary,
    ghost: COLORS.primary,
    success: '#fff',
    danger: '#fff',
  }[variant] || '#fff';

  const borderColor = variant === 'outline' ? COLORS.primary : 'transparent';

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        { backgroundColor: bgColor, borderColor, opacity: isDisabled ? 0.6 : 1 },
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon && icon}
          <Text style={[styles.text, { color: textColor }, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 2,
  },
  text: {
    fontSize: SIZES.base,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
