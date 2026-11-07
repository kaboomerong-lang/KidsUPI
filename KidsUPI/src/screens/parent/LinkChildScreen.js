// src/screens/parent/LinkChildScreen.js
// Parent sends a link request to a child via their email

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Card from '../../components/Card';
import { COLORS, SIZES, RADIUS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { getUserByEmail, getParentLinks, requestParentLink } from '../../utils/storage';
import { isValidEmail } from '../../utils/helpers';

export default function LinkChildScreen({ navigation }) {
  const { user } = useAuth();
  const [childEmail, setChildEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [foundChild, setFoundChild] = useState(null);

  const handleSearch = async () => {
    if (!isValidEmail(childEmail)) {
      Alert.alert('Invalid Email', 'Enter a valid Gmail address.');
      return;
    }
    setLoading(true);
    const child = await getUserByEmail(childEmail.trim().toLowerCase());
    if (!child) {
      Alert.alert('Not Found', 'No KidsUPI account found with this email.\nMake sure the child has the app installed and registered.');
      setLoading(false);
      return;
    }
    if (child.role !== 'child') {
      Alert.alert('Not a Child Account', 'This account is not registered as a child account.');
      setLoading(false);
      return;
    }
    if (child.email === user.email) {
      Alert.alert('Error', 'You cannot link to yourself.');
      setLoading(false);
      return;
    }
    setFoundChild(child);
    setLoading(false);
  };

  const handleSendRequest = async () => {
    setLoading(true);
    try {
      // Check if already linked
      const links = await getParentLinks();
      const alreadyLinked = links.find(l => l.parentEmail === user.email && l.childEmail === foundChild.email);
      if (alreadyLinked) {
        Alert.alert('Already Linked', 'This child account is already linked to yours.');
        setLoading(false);
        return;
      }
      await requestParentLink(user.email, foundChild.email);
      Alert.alert(
        '📨 Request Sent!',
        `A parent link request has been sent to ${foundChild.name}.\n\nAsk them to open KidsUPI and accept the request on their home screen.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>

        <Text style={styles.title}>Link Child Account 👨‍👩‍👧</Text>
        <Text style={styles.subtitle}>Connect to your child's KidsUPI account to monitor their spending and control their settings.</Text>

        <Card style={styles.card}>
          <Input
            label="Child's Gmail Address"
            value={childEmail}
            onChangeText={(v) => { setChildEmail(v); setFoundChild(null); }}
            placeholder="child@gmail.com"
            keyboardType="email-address"
            left={<Ionicons name="mail-outline" size={18} color={COLORS.textMuted} />}
          />
          <Button title="Find Child Account" onPress={handleSearch} loading={loading && !foundChild} />

          {foundChild && (
            <View style={styles.foundBox}>
              <Ionicons name="checkmark-circle" size={28} color={COLORS.success} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.foundName}>{foundChild.name}</Text>
                <Text style={styles.foundMeta}>@{foundChild.username} · Child Account</Text>
              </View>
            </View>
          )}

          {foundChild && (
            <Button
              title="Send Link Request 📨"
              onPress={handleSendRequest}
              loading={loading}
              style={{ marginTop: 16 }}
              variant="success"
            />
          )}
        </Card>

        <Card style={styles.howCard}>
          <Text style={styles.howTitle}>📋 How it works</Text>
          <Text style={styles.howStep}>1. Enter your child's Gmail address above</Text>
          <Text style={styles.howStep}>2. Send a link request</Text>
          <Text style={styles.howStep}>3. Child opens KidsUPI and accepts on their home screen</Text>
          <Text style={styles.howStep}>4. ✅ You're linked! You can now see their spending & set limits</Text>
          <Text style={styles.howNote}>⚠️ Your child must already have a KidsUPI account to be linked.</Text>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  back: { marginBottom: 24 },
  title: { fontSize: SIZES.xxl, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  subtitle: { fontSize: SIZES.sm, color: COLORS.textMuted, marginBottom: 24, lineHeight: 20 },
  card: { padding: 24, marginBottom: 16 },

  foundBox: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: RADIUS.md,
    backgroundColor: COLORS.success + '15',
    borderWidth: 1.5, borderColor: COLORS.success,
    marginTop: 16,
  },
  foundName: { fontSize: SIZES.base, fontWeight: '800', color: COLORS.text },
  foundMeta: { fontSize: SIZES.sm, color: COLORS.textMuted },

  howCard: { padding: 20, backgroundColor: COLORS.primaryLight },
  howTitle: { fontSize: SIZES.sm, fontWeight: '800', color: COLORS.primary, marginBottom: 12 },
  howStep: { fontSize: SIZES.sm, color: COLORS.text, marginBottom: 6 },
  howNote: { fontSize: SIZES.xs, color: COLORS.textMuted, marginTop: 8, fontStyle: 'italic' },
});
