// src/screens/auth/RegisterScreen.js

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Card from '../../components/Card';
import { COLORS, SIZES, RADIUS } from '../../theme';
import { getUserByEmail, getUserByUsername, saveUser } from '../../utils/storage';
import { isValidEmail, generateOTP } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

const ROLES = [
  { key: 'parent', label: 'Parent 👨‍👩‍👧', desc: 'Monitor & manage kids\' accounts', color: COLORS.parent },
  { key: 'child', label: 'Child 🧒', desc: 'Learn how to spend wisely', color: COLORS.child },
];

export default function RegisterScreen({ navigation }) {
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('child');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!isValidEmail(email)) e.email = 'Enter a valid email';
    if (username.trim().length < 3) e.username = 'Username must be 3+ characters';
    if (!/^[a-z0-9_.]+$/i.test(username)) e.username = 'Only letters, numbers, _ and . allowed';
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) e.pin = 'PIN must be 4 digits';
    return e;
  };

  const handleRegister = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    try {
      const cleanEmail = email.toLowerCase().trim();
      const cleanUsername = username.toLowerCase().trim();

      const existing = await getUserByEmail(cleanEmail);
      if (existing) {
        Alert.alert('Already Registered', 'An account with this email already exists. Please login.');
        setLoading(false);
        return;
      }
      const usernameTaken = await getUserByUsername(cleanUsername);
      if (usernameTaken) {
        setErrors({ username: 'Username is already taken' });
        setLoading(false);
        return;
      }

      const newUser = {
        email: cleanEmail,
        name: name.trim(),
        username: cleanUsername,
        role,
        pin,
        balance: role === 'parent' ? 10000 : 500, // Starting balance
        spendingLimit: role === 'child' ? 200 : null,
        createdAt: Date.now(),
        pendingParentEmail: null,
      };

      await saveUser(newUser);
      await login(newUser);

      Alert.alert(
        '🎉 Account Created!',
        `Welcome to KidsUPI, ${name.trim()}!\n\nStarting balance: ₹${newUser.balance.toLocaleString('en-IN')}`,
        [{ text: 'Let\'s Go!' }]
      );
    } catch (err) {
      Alert.alert('Error', err.message);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>

        <Text style={styles.title}>Create Account 🚀</Text>
        <Text style={styles.subtitle}>Set up your KidsUPI account in seconds</Text>

        {/* Role Selector */}
        <Text style={styles.sectionLabel}>I am a...</Text>
        <View style={styles.roleRow}>
          {ROLES.map(r => (
            <TouchableOpacity
              key={r.key}
              style={[styles.roleCard, role === r.key && { borderColor: r.color, backgroundColor: r.color + '15' }]}
              onPress={() => setRole(r.key)}
            >
              <Text style={styles.roleLabel}>{r.label}</Text>
              <Text style={styles.roleDesc}>{r.desc}</Text>
              {role === r.key && (
                <View style={[styles.roleDot, { backgroundColor: r.color }]}>
                  <Ionicons name="checkmark" size={12} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Card style={styles.card}>
          <Input label="Full Name" value={name} onChangeText={setName}
            placeholder="Your name" error={errors.name}
            left={<Ionicons name="person-outline" size={18} color={COLORS.textMuted} />} />

          <Input label="Gmail Address" value={email} onChangeText={setEmail}
            placeholder="you@gmail.com" keyboardType="email-address" error={errors.email}
            left={<Ionicons name="mail-outline" size={18} color={COLORS.textMuted} />} />

          <Input label="Username" value={username} onChangeText={setUsername}
            placeholder="e.g. aarav_2024" error={errors.username}
            left={<Text style={{ color: COLORS.textMuted }}>@</Text>} />

          <Input label="4-Digit PIN" value={pin} onChangeText={setPin}
            placeholder="●●●●" keyboardType="number-pad" secureTextEntry error={errors.pin}
            left={<Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} />} />

          <View style={styles.startingBalance}>
            <Ionicons name="wallet-outline" size={18} color={COLORS.success} />
            <Text style={styles.balanceText}>
              Starting balance:{' '}
              <Text style={{ fontWeight: '800', color: COLORS.success }}>
                ₹{role === 'parent' ? '10,000' : '500'}
              </Text>
            </Text>
          </View>

          <Button title="Create My Account 🎉" onPress={handleRegister} loading={loading} style={{ marginTop: 16 }} />
        </Card>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLink}>
            Already have an account?{' '}
            <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Login</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  back: { marginBottom: 24 },
  title: { fontSize: SIZES.xxxl, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  subtitle: { fontSize: SIZES.base, color: COLORS.textMuted, marginBottom: 24 },
  sectionLabel: { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.text, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  roleCard: {
    flex: 1, padding: 14, borderRadius: RADIUS.md,
    borderWidth: 2, borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  roleLabel: { fontSize: SIZES.base, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  roleDesc: { fontSize: SIZES.xs, color: COLORS.textMuted },
  roleDot: {
    position: 'absolute', top: 10, right: 10,
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  card: { padding: 24, marginBottom: 24 },
  startingBalance: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.success + '15',
    padding: 12, borderRadius: RADIUS.sm,
    marginTop: 4,
  },
  balanceText: { fontSize: SIZES.sm, color: COLORS.text },
  loginLink: { textAlign: 'center', color: COLORS.textMuted, fontSize: SIZES.sm },
});
