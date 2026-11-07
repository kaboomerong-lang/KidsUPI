// src/screens/auth/WelcomeScreen.js

import React from 'react';
import {
  View, Text, StyleSheet, Image, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '../../components/Button';
import { COLORS, SIZES, RADIUS } from '../../theme';

export default function WelcomeScreen({ navigation }) {
  return (
    <LinearGradient colors={['#6C63FF', '#A78BFA']} style={styles.root}>
      <StatusBar barStyle="light-content" />

      <View style={styles.logoBox}>
        {/* Coin icon made with shapes */}
        <View style={styles.coinOuter}>
          <View style={styles.coinInner}>
            <Text style={styles.coinText}>₹</Text>
          </View>
        </View>
        <Text style={styles.appName}>KidsUPI</Text>
        <Text style={styles.tagline}>Safe • Fun • Educational Payments</Text>
      </View>

      <View style={styles.featureBox}>
        {[
          { icon: '👨‍👩‍👧‍👦', text: 'Parent & Child Accounts' },
          { icon: '📱', text: 'Tap-to-Pay & QR Code' },
          { icon: '📊', text: 'Track Spending Together' },
          { icon: '🔒', text: '100% Safe — No Real Money' },
        ].map(f => (
          <View key={f.text} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.btnBox}>
        <Button
          title="Login with Gmail"
          onPress={() => navigation.navigate('Login')}
          style={styles.btnWhite}
          textStyle={{ color: COLORS.primary }}
        />
        <Button
          title="Create New Account"
          onPress={() => navigation.navigate('Register')}
          variant="outline"
          style={styles.btnOutline}
          textStyle={{ color: '#fff' }}
        />
      </View>

      <Text style={styles.disclaimer}>
        ⚠️ KidsUPI is a simulation only. No real money is transferred.
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 32 },
  logoBox: { alignItems: 'center', marginBottom: 40 },
  coinOuter: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  coinInner: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#FFD700',
    alignItems: 'center', justifyContent: 'center',
  },
  coinText: { fontSize: 36, color: '#7B5E00', fontWeight: '900' },
  appName: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  tagline: { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  featureBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.lg,
    padding: 20,
    marginBottom: 32,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  featureIcon: { fontSize: 20, marginRight: 12 },
  featureText: { fontSize: SIZES.base, color: '#fff', fontWeight: '500' },

  btnBox: { gap: 12 },
  btnWhite: { backgroundColor: '#fff', borderColor: '#fff' },
  btnOutline: { borderColor: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(255,255,255,0.1)' },

  disclaimer: {
    fontSize: SIZES.xs,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 20,
  },
});
