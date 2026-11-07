// src/screens/main/ReceiveScreen.js
// Shows QR code + tap code for receiving money

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Share, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Card from '../../components/Card';
import { COLORS, SIZES, RADIUS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { generateTapCode, buildQRPayload, formatRupee } from '../../utils/helpers';
import { updateUser } from '../../utils/storage';
import QRDisplay from '../../components/QRDisplay';

export default function ReceiveScreen({ navigation }) {
  const { user, refreshUser } = useAuth();
  const [tapCode, setTapCode] = useState('');
  const [codeExpiry, setCodeExpiry] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const generateCode = useCallback(async () => {
    const code = generateTapCode();
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes
    setTapCode(code);
    setCodeExpiry(expiry);
    setTimeLeft(300);
    await updateUser(user.email, { activeTapCode: code, tapCodeExpiry: expiry });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [user?.email]);

  useFocusEffect(useCallback(() => {
    generateCode();
  }, [generateCode]));

  // Countdown timer
  useFocusEffect(useCallback(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [codeExpiry]));

  const qrPayload = user ? buildQRPayload(user) : '';
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  const handleShare = async () => {
    await Share.share({
      message: `Pay me on KidsUPI!\nScan my QR or use my Gmail: ${user?.email}\nor Username: @${user?.username}`,
    });
  };

  if (!user) return null;

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#6C63FF', '#A78BFA']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Receive Money 💰</Text>
        <Text style={styles.subtitle}>Show this to the sender</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* QR Code */}
        <Card style={styles.qrCard} shadow="md">
          <Text style={styles.cardTitle}>📲 Scan QR Code</Text>
          <View style={styles.qrBox}>
            <QRDisplay value={qrPayload} size={200} />
          </View>
          <Text style={styles.qrInfo}>{user.name}</Text>
          <Text style={styles.qrSub}>@{user.username} · {user.email}</Text>
        </Card>

        {/* Tap Code */}
        <Card style={styles.tapCard} shadow="md">
          <View style={styles.tapHeader}>
            <Text style={styles.cardTitle}>📱 Tap Code</Text>
            <TouchableOpacity onPress={generateCode}>
              <Ionicons name="refresh-circle" size={28} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.tapDesc}>
            Share this 6-character code with the sender. They type it in the Send screen.
          </Text>
          <View style={styles.codeRow}>
            {(tapCode || '------').split('').map((c, i) => (
              <View key={i} style={styles.codeBox}>
                <Text style={styles.codeChar}>{c}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.expiryText}>
            {timeLeft > 0
              ? `⏱ Expires in ${mins}:${secs.toString().padStart(2, '0')}`
              : '⚠️ Code expired — tap refresh to generate a new one'
            }
          </Text>
        </Card>

        {/* Share Button */}
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={20} color={COLORS.primary} />
          <Text style={styles.shareText}>Share Payment Info</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingTop: 56, paddingBottom: 24, paddingHorizontal: 24,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  back: { marginBottom: 16 },
  title: { fontSize: SIZES.xxl, fontWeight: '900', color: '#fff' },
  subtitle: { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  content: { flex: 1, padding: 16, paddingTop: 20 },

  qrCard: { alignItems: 'center', marginBottom: 16, padding: 24 },
  cardTitle: { fontSize: SIZES.base, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  qrBox: {
    padding: 16, backgroundColor: '#fff',
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    marginBottom: 12,
  },
  qrInfo: { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.text },
  qrSub: { fontSize: SIZES.sm, color: COLORS.textMuted, marginTop: 2 },

  tapCard: { marginBottom: 16, padding: 20 },
  tapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tapDesc: { fontSize: SIZES.sm, color: COLORS.textMuted, marginBottom: 16 },
  codeRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 12 },
  codeBox: {
    width: 44, height: 52, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2, borderColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  codeChar: { fontSize: SIZES.xl, fontWeight: '900', color: COLORS.primary },
  expiryText: { fontSize: SIZES.xs, color: COLORS.textMuted, textAlign: 'center' },

  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14,
    borderWidth: 2, borderColor: COLORS.primary, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
  },
  shareText: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.primary },
});
