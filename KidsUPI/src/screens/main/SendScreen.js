// src/screens/main/SendScreen.js
// Send money via Gmail address, username, QR, or tap code

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Alert, TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Card from '../../components/Card';
import Avatar from '../../components/Avatar';
import { COLORS, SIZES, RADIUS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import {
  getUserByEmail, getUserByUsername, addTransaction, updateUserBalance,
  getAllUsers,
} from '../../utils/storage';
import {
  generateTxId, formatRupee, isValidAmount, isValidEmail,
} from '../../utils/helpers';
import * as Haptics from 'expo-haptics';

const METHODS = [
  { key: 'email', label: 'Gmail / Email', icon: 'mail-outline' },
  { key: 'username', label: 'Username (@)', icon: 'at-outline' },
  { key: 'tapcode', label: 'Tap Code', icon: 'phone-portrait-outline' },
];

export default function SendScreen({ navigation }) {
  const { user, refreshUser } = useAuth();
  const [method, setMethod] = useState('email');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipientUser, setRecipientUser] = useState(null);
  const [pin, setPin] = useState('');
  const [step, setStep] = useState('form'); // 'form' | 'confirm' | 'pin'

  const lookupRecipient = async () => {
    if (!recipient.trim()) {
      Alert.alert('Error', 'Please enter a recipient.');
      return;
    }
    setLoading(true);
    let found = null;
    try {
      if (method === 'email') {
        found = await getUserByEmail(recipient.trim().toLowerCase());
      } else if (method === 'username') {
        found = await getUserByUsername(recipient.trim().replace('@', '').toLowerCase());
      } else if (method === 'tapcode') {
        // Look up by tap code stored in user object
        const all = await getAllUsers();
        found = Object.values(all).find(u => u.activeTapCode === recipient.trim().toUpperCase());
        if (!found) {
          Alert.alert('Code Not Found', 'No active tap code matches. Ask the receiver to generate a fresh code on their Receive screen.');
          setLoading(false);
          return;
        }
      }

      if (!found) {
        Alert.alert('User Not Found', 'No KidsUPI account found. Both sender and receiver must have the app installed.');
        setLoading(false);
        return;
      }
      if (found.email === user.email) {
        Alert.alert('Error', 'You cannot send money to yourself.');
        setLoading(false);
        return;
      }

      if (!isValidAmount(amount)) {
        Alert.alert('Invalid Amount', 'Enter a valid amount greater than ₹0.');
        setLoading(false);
        return;
      }

      const amt = parseFloat(amount);
      if (amt > user.balance) {
        Alert.alert('Insufficient Balance', `Your balance is only ${formatRupee(user.balance)}.`);
        setLoading(false);
        return;
      }

      setRecipientUser(found);
      setStep('confirm');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
  };

  const handlePinConfirm = async () => {
    if (pin !== user.pin) {
      Alert.alert('Wrong PIN', 'Incorrect PIN. Please try again.');
      return;
    }
    setLoading(true);
    try {
      const amt = parseFloat(amount);
      const newSenderBal = user.balance - amt;
      const newReceiverBal = recipientUser.balance + amt;

      await updateUserBalance(user.email, newSenderBal);
      await updateUserBalance(recipientUser.email, newReceiverBal);

      const tx = {
        id: generateTxId(),
        senderEmail: user.email,
        senderName: user.name,
        receiverEmail: recipientUser.email,
        receiverName: recipientUser.name,
        amount: amt,
        note: note.trim(),
        timestamp: Date.now(),
        method,
      };
      await addTransaction(tx);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refreshUser();

      Alert.alert(
        '✅ Money Sent!',
        `You sent ${formatRupee(amt)} to ${recipientUser.name}!\n\nTx ID: ${tx.id}`,
        [{
          text: 'Done',
          onPress: () => {
            setStep('form');
            setRecipient('');
            setAmount('');
            setNote('');
            setPin('');
            setRecipientUser(null);
            navigation.goBack();
          },
        }]
      );
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => {
          if (step !== 'form') { setStep('form'); setRecipientUser(null); setPin(''); }
          else navigation.goBack();
        }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>

        <Text style={styles.title}>Send Money 💸</Text>
        <Text style={styles.subtitle}>Balance: <Text style={{ color: COLORS.success, fontWeight: '800' }}>{formatRupee(user?.balance ?? 0)}</Text></Text>

        {step === 'form' && (
          <>
            {/* Method Selector */}
            <View style={styles.methodRow}>
              {METHODS.map(m => (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.methodBtn, method === m.key && styles.methodActive]}
                  onPress={() => { setMethod(m.key); setRecipient(''); setRecipientUser(null); }}
                >
                  <Ionicons name={m.icon} size={16} color={method === m.key ? COLORS.primary : COLORS.textMuted} />
                  <Text style={[styles.methodText, method === m.key && { color: COLORS.primary }]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Card style={styles.card}>
              <Input
                label={method === 'email' ? 'Recipient Gmail' : method === 'username' ? 'Recipient Username' : '6-Character Tap Code'}
                value={recipient}
                onChangeText={setRecipient}
                placeholder={method === 'email' ? 'friend@gmail.com' : method === 'username' ? '@username' : 'e.g. AB3X7K'}
                keyboardType={method === 'email' ? 'email-address' : 'default'}
                autoCapitalize={method === 'tapcode' ? 'characters' : 'none'}
                left={<Ionicons name={METHODS.find(m => m.key === method)?.icon} size={18} color={COLORS.textMuted} />}
              />

              <Input
                label="Amount (₹)"
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                left={<Text style={{ fontSize: SIZES.lg, color: COLORS.textMuted, fontWeight: '700' }}>₹</Text>}
              />

              <Input
                label="Note (Optional)"
                value={note}
                onChangeText={setNote}
                placeholder="What's this for?"
                left={<Ionicons name="chatbubble-outline" size={18} color={COLORS.textMuted} />}
              />

              <Button title="Find Recipient & Continue" onPress={lookupRecipient} loading={loading} style={{ marginTop: 8 }} />
            </Card>

            <Card style={styles.tipCard}>
              <Text style={styles.tipTitle}>💡 How to Send</Text>
              <Text style={styles.tipText}>• By Email: type their Gmail address</Text>
              <Text style={styles.tipText}>• By Username: type their @username</Text>
              <Text style={styles.tipText}>• Tap Code: get the 6-char code from the receiver's Receive screen, then type it here</Text>
              <Text style={styles.tipText}>• QR Code: tap the QR Code tab to scan</Text>
            </Card>
          </>
        )}

        {step === 'confirm' && recipientUser && (
          <Card style={styles.card}>
            <Text style={styles.confirmTitle}>Confirm Transfer</Text>

            <View style={styles.confirmRow}>
              <Avatar name={user.name} size={56} />
              <View style={styles.arrow}>
                <Ionicons name="arrow-forward" size={24} color={COLORS.primary} />
              </View>
              <Avatar name={recipientUser.name} size={56} />
            </View>

            <View style={styles.confirmDetail}>
              <Text style={styles.confirmLabel}>From</Text>
              <Text style={styles.confirmValue}>{user.name} (@{user.username})</Text>
            </View>
            <View style={styles.confirmDetail}>
              <Text style={styles.confirmLabel}>To</Text>
              <Text style={styles.confirmValue}>{recipientUser.name} (@{recipientUser.username})</Text>
            </View>
            <View style={styles.confirmDetail}>
              <Text style={styles.confirmLabel}>Amount</Text>
              <Text style={[styles.confirmValue, { color: COLORS.danger, fontSize: SIZES.xxl, fontWeight: '900' }]}>
                {formatRupee(parseFloat(amount))}
              </Text>
            </View>
            {note ? (
              <View style={styles.confirmDetail}>
                <Text style={styles.confirmLabel}>Note</Text>
                <Text style={styles.confirmValue}>"{note}"</Text>
              </View>
            ) : null}

            <Input
              label="Enter your 4-Digit PIN to confirm"
              value={pin}
              onChangeText={setPin}
              placeholder="●●●●"
              keyboardType="number-pad"
              secureTextEntry
              style={{ marginTop: 20 }}
            />

            <Button title="Confirm & Send 🚀" onPress={handlePinConfirm} loading={loading} style={{ marginTop: 8 }} />
            <Button
              title="Cancel"
              onPress={() => { setStep('form'); setRecipientUser(null); setPin(''); }}
              variant="ghost"
              style={{ marginTop: 8 }}
            />
          </Card>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  back: { marginBottom: 24 },
  title: { fontSize: SIZES.xxxl, fontWeight: '900', color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: SIZES.base, color: COLORS.textMuted, marginBottom: 24 },
  methodRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  methodBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 10, borderRadius: RADIUS.sm,
    borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  methodActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  methodText: { fontSize: SIZES.xs, color: COLORS.textMuted, fontWeight: '600' },
  card: { padding: 24, marginBottom: 16 },
  tipCard: { padding: 16, backgroundColor: COLORS.primaryLight },
  tipTitle: { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.primary, marginBottom: 8 },
  tipText: { fontSize: SIZES.sm, color: COLORS.text, marginBottom: 4 },

  confirmTitle: { fontSize: SIZES.xl, fontWeight: '900', color: COLORS.text, textAlign: 'center', marginBottom: 24 },
  confirmRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 24 },
  arrow: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  confirmDetail: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  confirmLabel: { fontSize: SIZES.sm, color: COLORS.textMuted, fontWeight: '600' },
  confirmValue: { fontSize: SIZES.base, color: COLORS.text, fontWeight: '700', maxWidth: '60%', textAlign: 'right' },
});
