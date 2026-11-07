// src/screens/auth/LoginScreen.js

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Alert, TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Card from '../../components/Card';
import { COLORS, SIZES, RADIUS } from '../../theme';
import {
  getUserByEmail, storeOTP, verifyOTP, clearOTP,
} from '../../utils/storage';
import { generateOTP, isValidEmail } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [loading, setLoading] = useState(false);
  const [generatedOTP, setGeneratedOTP] = useState(null);

  const handleSendOTP = async () => {
    if (!isValidEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid Gmail address.');
      return;
    }
    setLoading(true);
    try {
      const user = await getUserByEmail(email.toLowerCase().trim());
      if (!user) {
        Alert.alert('Account Not Found', 'No KidsUPI account with this email. Please register first.');
        setLoading(false);
        return;
      }
      const code = generateOTP();
      await storeOTP(email.toLowerCase().trim(), code);
      setGeneratedOTP(code);
      setStep('otp');
      // In production this OTP would be sent via email/SMS.
      // Here we show it in an alert to simulate the email delivery.
      Alert.alert(
        '📧 OTP Sent!',
        `Your OTP: ${code}\n\n(In a real app this would be emailed to ${email})`,
        [{ text: 'Got it!' }]
      );
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP.');
      return;
    }
    setLoading(true);
    try {
      const valid = await verifyOTP(email.toLowerCase().trim(), otp.trim());
      if (!valid) {
        Alert.alert('Wrong OTP', 'The OTP is incorrect or has expired. Try again.');
        setLoading(false);
        return;
      }
      await clearOTP(email.toLowerCase().trim());
      const user = await getUserByEmail(email.toLowerCase().trim());
      await login(user);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setOtp('');
    await handleSendOTP();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>

        <Text style={styles.title}>Welcome Back! 👋</Text>
        <Text style={styles.subtitle}>Log in to your KidsUPI account using your Gmail</Text>

        <Card style={styles.card}>
          {step === 'email' ? (
            <>
              <Input
                label="Gmail Address"
                value={email}
                onChangeText={setEmail}
                placeholder="you@gmail.com"
                keyboardType="email-address"
                left={<Ionicons name="mail-outline" size={20} color={COLORS.textMuted} />}
              />
              <Button
                title="Send OTP to Gmail"
                onPress={handleSendOTP}
                loading={loading}
                style={{ marginTop: 8 }}
              />
            </>
          ) : (
            <>
              <View style={styles.otpHeader}>
                <Ionicons name="shield-checkmark-outline" size={40} color={COLORS.primary} />
                <Text style={styles.otpTitle}>Enter OTP</Text>
                <Text style={styles.otpSub}>
                  A 6-digit code was sent to{'\n'}
                  <Text style={{ fontWeight: '700', color: COLORS.text }}>{email}</Text>
                </Text>
              </View>

              <Input
                label="6-Digit OTP"
                value={otp}
                onChangeText={setOtp}
                placeholder="● ● ● ● ● ●"
                keyboardType="number-pad"
                style={{ marginTop: 16 }}
              />

              <Button
                title="Verify & Login"
                onPress={handleVerifyOTP}
                loading={loading}
                style={{ marginTop: 8 }}
              />

              <TouchableOpacity style={styles.resend} onPress={handleResend}>
                <Text style={styles.resendText}>Didn't get it? Resend OTP</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.resend} onPress={() => setStep('email')}>
                <Text style={{ color: COLORS.textMuted, fontSize: SIZES.sm }}>← Change email</Text>
              </TouchableOpacity>
            </>
          )}
        </Card>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerLink}>
            Don't have an account?{' '}
            <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Register here</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 24, paddingTop: 60 },
  back: { marginBottom: 24 },
  title: { fontSize: SIZES.xxxl, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  subtitle: { fontSize: SIZES.base, color: COLORS.textMuted, marginBottom: 32 },
  card: { padding: 24, marginBottom: 24 },
  otpHeader: { alignItems: 'center', marginBottom: 8 },
  otpTitle: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.text, marginTop: 12 },
  otpSub: { fontSize: SIZES.sm, color: COLORS.textMuted, textAlign: 'center', marginTop: 4 },
  resend: { alignItems: 'center', marginTop: 16 },
  resendText: { color: COLORS.primary, fontWeight: '600', fontSize: SIZES.sm },
  registerLink: { textAlign: 'center', color: COLORS.textMuted, fontSize: SIZES.sm },
});
