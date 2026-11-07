// src/screens/parent/ChildDetailScreen.js
// Parent: view child's balance, transactions, set spending limit

import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Card from '../../components/Card';
import Avatar from '../../components/Avatar';
import { COLORS, SIZES, RADIUS } from '../../theme';
import {
  getUserByEmail, getTransactionsForUser,
  setSpendingLimit, updateUserBalance,
} from '../../utils/storage';
import { formatRupee, formatDate, txColor, txSign } from '../../utils/helpers';

export default function ChildDetailScreen({ route, navigation }) {
  const { childEmail } = route.params;
  const [child, setChild] = useState(null);
  const [txs, setTxs] = useState([]);
  const [limitInput, setLimitInput] = useState('');
  const [topupAmount, setTopupAmount] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const c = await getUserByEmail(childEmail);
    setChild(c);
    if (c) setLimitInput(c.spendingLimit?.toString() ?? '');
    const t = await getTransactionsForUser(childEmail);
    setTxs(t.slice(0, 20));
  }, [childEmail]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleSetLimit = async () => {
    const l = parseFloat(limitInput);
    if (isNaN(l) || l <= 0) { Alert.alert('Error', 'Enter a valid spending limit.'); return; }
    await setSpendingLimit(childEmail, l);
    await load();
    Alert.alert('✅ Limit Set', `Spending limit set to ${formatRupee(l)} for ${child?.name}.`);
  };

  const handleTopUp = async () => {
    const amt = parseFloat(topupAmount);
    if (isNaN(amt) || amt <= 0) { Alert.alert('Error', 'Enter a valid amount.'); return; }
    await updateUserBalance(childEmail, (child?.balance ?? 0) + amt);
    await load();
    setTopupAmount('');
    Alert.alert('💰 Topped Up!', `Added ${formatRupee(amt)} to ${child?.name}'s account.`);
  };

  if (!child) return (
    <View style={styles.center}>
      <Text>Loading…</Text>
    </View>
  );

  const totalSpent = txs.filter(t => t.senderEmail === childEmail).reduce((s, t) => s + t.amount, 0);
  const totalReceived = txs.filter(t => t.receiverEmail === childEmail).reduce((s, t) => s + t.amount, 0);

  return (
    <ScrollView
      style={styles.root}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {/* Header */}
      <LinearGradient colors={['#F97316', '#FB923C']} style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Avatar name={child.name} size={72} style={{ marginBottom: 12 }} />
        <Text style={styles.childName}>{child.name}</Text>
        <Text style={styles.childMeta}>@{child.username} · {child.email}</Text>
        <Text style={styles.balance}>{formatRupee(child.balance)}</Text>
        <Text style={styles.balanceLabel}>Current Balance</Text>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Ionicons name="arrow-up-circle-outline" size={24} color={COLORS.danger} />
          <Text style={styles.statValue}>{formatRupee(totalSpent)}</Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </Card>
        <Card style={styles.statCard}>
          <Ionicons name="arrow-down-circle-outline" size={24} color={COLORS.success} />
          <Text style={styles.statValue}>{formatRupee(totalReceived)}</Text>
          <Text style={styles.statLabel}>Total Received</Text>
        </Card>
        <Card style={styles.statCard}>
          <Ionicons name="shield-outline" size={24} color={COLORS.primary} />
          <Text style={styles.statValue}>{child.spendingLimit ? formatRupee(child.spendingLimit) : '—'}</Text>
          <Text style={styles.statLabel}>Spending Limit</Text>
        </Card>
      </View>

      {/* Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ Controls</Text>

        <Card style={{ padding: 20 }}>
          <Text style={styles.controlLabel}>Set Spending Limit</Text>
          <View style={styles.controlRow}>
            <Input
              value={limitInput}
              onChangeText={setLimitInput}
              placeholder="e.g. 500"
              keyboardType="decimal-pad"
              style={{ flex: 1, marginBottom: 0, marginRight: 12 }}
              left={<Text style={{ color: COLORS.textMuted, fontWeight: '700' }}>₹</Text>}
            />
            <Button title="Set" onPress={handleSetLimit} style={{ paddingHorizontal: 20 }} />
          </View>
          <Text style={styles.controlHint}>Child cannot spend beyond this limit per period.</Text>
        </Card>

        <Card style={{ padding: 20, marginTop: 12 }}>
          <Text style={styles.controlLabel}>Top Up Balance (Allowance)</Text>
          <View style={styles.controlRow}>
            <Input
              value={topupAmount}
              onChangeText={setTopupAmount}
              placeholder="e.g. 200"
              keyboardType="decimal-pad"
              style={{ flex: 1, marginBottom: 0, marginRight: 12 }}
              left={<Text style={{ color: COLORS.textMuted, fontWeight: '700' }}>₹</Text>}
            />
            <Button title="Add" onPress={handleTopUp} variant="success" style={{ paddingHorizontal: 20 }} />
          </View>
        </Card>
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Activity</Text>
        {txs.length === 0 ? (
          <Card style={{ padding: 24, alignItems: 'center' }}>
            <Ionicons name="receipt-outline" size={32} color={COLORS.textLight} />
            <Text style={{ color: COLORS.textMuted, marginTop: 8 }}>No activity yet</Text>
          </Card>
        ) : (
          txs.map(tx => (
            <Card key={tx.id} style={styles.txCard}>
              <View style={[styles.txIcon, { backgroundColor: txColor(tx, childEmail) + '20' }]}>
                <Ionicons
                  name={tx.receiverEmail === childEmail ? 'arrow-down' : 'arrow-up'}
                  size={16}
                  color={txColor(tx, childEmail)}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.txName}>
                  {tx.receiverEmail === childEmail ? tx.senderName : tx.receiverName}
                </Text>
                <Text style={styles.txDate}>{formatDate(tx.timestamp)}</Text>
                {tx.note ? <Text style={styles.txNote}>"{tx.note}"</Text> : null}
              </View>
              <Text style={[styles.txAmount, { color: txColor(tx, childEmail) }]}>
                {txSign(tx, childEmail)}{formatRupee(tx.amount)}
              </Text>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingTop: 60, paddingBottom: 28, paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  back: { alignSelf: 'flex-start', marginBottom: 16 },
  childName: { fontSize: SIZES.xxl, fontWeight: '900', color: '#fff' },
  childMeta: { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  balance: { fontSize: 36, fontWeight: '900', color: '#fff', marginTop: 12 },
  balanceLabel: { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: 10, padding: 16 },
  statCard: { flex: 1, alignItems: 'center', padding: 14, gap: 4 },
  statValue: { fontSize: SIZES.sm, fontWeight: '800', color: COLORS.text, marginTop: 4 },
  statLabel: { fontSize: SIZES.xs, color: COLORS.textMuted, textAlign: 'center' },

  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.text, marginBottom: 12 },

  controlLabel: { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  controlRow: { flexDirection: 'row', alignItems: 'center' },
  controlHint: { fontSize: SIZES.xs, color: COLORS.textMuted, marginTop: 8 },

  txCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, padding: 12 },
  txIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  txName: { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.text },
  txDate: { fontSize: SIZES.xs, color: COLORS.textMuted },
  txNote: { fontSize: SIZES.xs, color: COLORS.textMuted, fontStyle: 'italic' },
  txAmount: { fontSize: SIZES.sm, fontWeight: '800' },
});
