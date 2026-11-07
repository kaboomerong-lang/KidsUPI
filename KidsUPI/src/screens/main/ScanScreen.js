// src/screens/main/ScanScreen.js
// QR code scanner to send money

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, RADIUS } from '../../theme';
import { parseQRPayload } from '../../utils/helpers';

export default function ScanScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ data }) => {
    if (scanned) return;
    setScanned(true);
    const payload = parseQRPayload(data);
    if (!payload) {
      Alert.alert(
        'Invalid QR Code',
        'This QR code is not a valid KidsUPI payment code.',
        [{ text: 'Try Again', onPress: () => setScanned(false) }]
      );
      return;
    }
    // Navigate to Send with pre-filled recipient
    navigation.navigate('Send', {
      prefilledEmail: payload.email,
      prefilledName: payload.name,
    });
  };

  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>Requesting camera permission…</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-off-outline" size={48} color={COLORS.danger} />
        <Text style={styles.msg}>Camera access denied.</Text>
        <Text style={styles.sub}>Please enable it in Settings to scan QR codes.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <BarCodeScanner
        style={StyleSheet.absoluteFillObject}
        onBarCodeScanned={handleBarCodeScanned}
        barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.title}>Scan QR Code</Text>
        <Text style={styles.subtitle}>Point at the recipient's KidsUPI QR code</Text>

        <View style={styles.scanFrame} />

        {scanned && (
          <TouchableOpacity style={styles.retryBtn} onPress={() => setScanned(false)}>
            <Text style={styles.retryText}>Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: COLORS.bg },
  msg: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text, marginTop: 16, textAlign: 'center' },
  sub: { fontSize: SIZES.sm, color: COLORS.textMuted, marginTop: 8, textAlign: 'center' },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    paddingTop: 60,
  },
  back: {
    position: 'absolute', top: 56, left: 24,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: SIZES.xxl, fontWeight: '900', color: '#fff', marginTop: 60 },
  subtitle: { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.7)', marginTop: 4, marginBottom: 32 },

  scanFrame: {
    width: 250, height: 250,
    borderWidth: 3, borderColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    backgroundColor: 'transparent',
  },

  retryBtn: {
    marginTop: 32, paddingHorizontal: 32, paddingVertical: 14,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
  },
  retryText: { color: '#fff', fontWeight: '800', fontSize: SIZES.base },
});
