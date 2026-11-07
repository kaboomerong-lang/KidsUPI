// src/components/Input.js

import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES, RADIUS } from '../theme';
import { Ionicons } from '@expo/vector-icons';

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  style,
  inputStyle,
  multiline = false,
  editable = true,
  left,
  right,
}) {
  const [showPass, setShowPass] = useState(false);
  const isPass = secureTextEntry;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.row, error && styles.errorBorder, !editable && styles.disabled]}>
        {left && <View style={styles.side}>{left}</View>}
        <TextInput
          style={[styles.input, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textLight}
          secureTextEntry={isPass && !showPass}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          editable={editable}
        />
        {isPass && (
          <TouchableOpacity style={styles.side} onPress={() => setShowPass(!showPass)}>
            <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
        {right && !isPass && <View style={styles.side}>{right}</View>}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: {
    fontSize: SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    minHeight: 50,
  },
  errorBorder: { borderColor: COLORS.danger },
  disabled: { backgroundColor: '#F3F4F6' },
  input: {
    flex: 1,
    fontSize: SIZES.base,
    color: COLORS.text,
    paddingVertical: 12,
  },
  side: {
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    fontSize: SIZES.sm,
    color: COLORS.danger,
    marginTop: 4,
  },
});
