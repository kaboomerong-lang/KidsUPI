// src/screens/main/TapPayScreen.js
// Simulated NFC "Tap to Pay" — shows a tap code and receiver puts their phone face-down

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity, Easing,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SIZES, RADIUS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { generateTapCode } from '../../utils/helpers';
import { updateUser } from '../../utils/storage';

export default function TapPayScreen({ navigation }) {
  const { user } = useAuth();
  const [tapCode, setTapCode] = useState('');
  const [pulse] = useState(new Animated.Value(1));
  const [timeLeft, setTimeLeft] = useState(300);

  const gen = useCallback(async () => {
    const code = generateTapCode();
    setTapCode(code);
    setTimeLeft(300);
    await updateUser(user.email, { activeTapCode: code, tapCodeExpiry: Date.now() + 300000 });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, [user?.email]);

  useFocusEffect(useCallback(() => {
    gen();
    // Pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [gen]));

  useFocusEffect(useCallback(() => {
    const t = setInterval(() => setTimeLeft(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [tapCode]));

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.root}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.title}>📱 Tap to Pay</Text>
      <Text style={styles.subtitle}>
        How it works: Share your tap code with the sender. They type it in the Send screen's
        "Tap Code" method. This simulates NFC proximity pay!
      </Text>

      {/* Phone animation */}
      <Animated.View style={[styles.phoneCircle, { transform: [{ scale: pulse }] }]}>
        <View style={styles.phoneInner}>
          <Text style={styles.phoneEmoji}>📱</Text>
        </View>
      </Animated.View>

      {/* Tap Code Display */}
      <View style={styles.codeSection}>
        <Text style={styles.codeLabel}>Your Receive Code</Text>
        <View style={styles.codeRow}>
          {(tapCode || '------').split('').map((c, i) => (
            <View key={i} style={styles.codeBox}>
              <Text style={styles.codeChar}>{c}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.expiryText}>
          {timeLeft > 0
            ? `Expires in ${mins}:${secs.toString().padStart(2, '0')}`
            : '⚠️ Expired'}
        </Text>
      </View>

      <TouchableOpacity style={styles.refreshBtn} onPress={gen}>
        <Ionicons name="refresh" size={20} color={COLORS.primary} />
        <Text style={styles.refreshText}>Generate New Code</Text>
      </TouchableOpacity>

      <View style={styles.instructions}>
        <Text style={styles.instrTitle}>📋 Instructions</Text>
        <Text style={styles.instrText}>1. Show this code to the person sending you money</Text>
        <Text style={styles.instrText}>2. They open Send → choose "Tap Code"</Text>
        <Text style={styles.instrText}>3. They type this 6-character code</Text>
        <Text style={styles.instrText}>4. Enter amount & confirm with their PIN</Text>
        <Text style={styles.instrText}>5. ✅ Money arrives instantly!</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 32 },
  back: { marginBottom: 16 },
  title: { fontSize: SIZES.xxl, fontWeight: '900', color: '#fff', textAlign: 'center' },
  subtitle: {
    fontSize: SIZES.xs, color: 'rgba(255,255,255,0.6)',
    textAlign: 'center', marginTop: 8, marginBottom: 32, lineHeight: 18,
  },

  phoneCircle: {
    alignSelf: 'center',
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(108,99,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 2, borderColor: 'rgba(108,99,255,0.6)',
  },
  phoneInner: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(108,99,255,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  phoneEmoji: { fontSize: 48 },

  codeSection: { alignItems: 'center', marginBottom: 24 },
  codeLabel: { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.6)', marginBottom: 12, fontWeight: '600' },
  codeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  codeBox: {
    width: 44, height: 52, borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(108,99,255,0.3)',
    borderWidth: 2, borderColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  codeChar: { fontSize: SIZES.xl, fontWeight: '900', color: '#fff' },
  expiryText: { fontSize: SIZES.xs, color: 'rgba(255,255,255,0.5)' },

  refreshBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12,
    backgroundColor: 'rgba(108,99,255,0.2)',
    borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.primary,
    marginBottom: 24,
  },
  refreshText: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.primary },

  instructions: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: RADIUS.md, padding: 16,
  },
  instrTitle: { fontSize: SIZES.sm, fontWeight: '800', color: '#fff', marginBottom: 10 },
  instrText: { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.75)', marginBottom: 6 },
});
