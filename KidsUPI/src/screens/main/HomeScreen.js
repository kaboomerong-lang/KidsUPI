// src/screens/main/HomeScreen.js

import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, TouchableOpacity, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import Avatar from '../../components/Avatar';
import { COLORS, SIZES, RADIUS, SHADOW } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import {
  getTransactionsForUser, getChildrenOf, hasPendingParentRequest,
  acceptParentLink, rejectParentLink, updateUser,
} from '../../utils/storage';
import { formatRupee, formatDate, txColor, txSign } from '../../utils/helpers';

export default function HomeScreen({ navigation }) {
  const { user, refreshUser } = useAuth();
  const [txs, setTxs] = useState([]);
  const [children, setChildren] = useState([]);
  const [pendingParent, setPendingParent] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    const t = await getTransactionsForUser(user.email);
    setTxs(t.slice(0, 5));
    if (user.role === 'parent') {
      const kids = await getChildrenOf(user.email);
      setChildren(kids);
    }
    if (user.role === 'child') {
      const pending = await hasPendingParentRequest(user.email);
      setPendingParent(pending);
    }
    await refreshUser();
  }, [user?.email]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAcceptParent = async () => {
    await acceptParentLink(user.email);
    await loadData();
    Alert.alert('✅ Linked!', 'Your parent account has been linked successfully!');
  };

  const handleRejectParent = async () => {
    await rejectParentLink(user.email);
    await loadData();
  };

  if (!user) return null;

  const isParent = user.role === 'parent';
  const gradientColors = isParent
    ? ['#F97316', '#FB923C']
    : ['#6C63FF', '#A78BFA'];

  return (
    <ScrollView
      style={styles.root}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {/* Header Card */}
      <LinearGradient colors={gradientColors} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Hi, {user.name.split(' ')[0]}! 👋</Text>
            <Text style={styles.role}>{isParent ? '👨‍👩‍👧 Parent Account' : '🧒 Child Account'}</Text>
          </View>
          <Avatar name={user.name} size={48} />
        </View>

        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balance}>{formatRupee(user.balance)}</Text>
        <Text style={styles.username}>@{user.username}</Text>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.qaBtn} onPress={() => navigation.navigate('Send')}>
            <Ionicons name="paper-plane" size={20} color="#fff" />
            <Text style={styles.qaText}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.qaBtn} onPress={() => navigation.navigate('Receive')}>
            <Ionicons name="download" size={20} color="#fff" />
            <Text style={styles.qaText}>Receive</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.qaBtn} onPress={() => navigation.navigate('Scan')}>
            <Ionicons name="qr-code" size={20} color="#fff" />
            <Text style={styles.qaText}>Scan QR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.qaBtn} onPress={() => navigation.navigate('Tap')}>
            <Ionicons name="phone-portrait" size={20} color="#fff" />
            <Text style={styles.qaText}>Tap Pay</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Pending Parent Request Banner */}
      {user.role === 'child' && pendingParent && (
        <Card style={styles.pendingCard}>
          <Ionicons name="people-outline" size={24} color={COLORS.parent} style={{ marginBottom: 8 }} />
          <Text style={styles.pendingTitle}>Parent Link Request</Text>
          <Text style={styles.pendingText}>
            <Text style={{ fontWeight: '700' }}>{pendingParent}</Text>{' '}
            wants to be your parent and monitor your account.
          </Text>
          <View style={styles.pendingBtns}>
            <TouchableOpacity style={[styles.pendingBtn, { backgroundColor: COLORS.success }]} onPress={handleAcceptParent}>
              <Text style={styles.pendingBtnText}>✅ Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pendingBtn, { backgroundColor: COLORS.danger }]} onPress={handleRejectParent}>
              <Text style={styles.pendingBtnText}>❌ Reject</Text>
            </TouchableOpacity>
          </View>
        </Card>
      )}

      {/* Children Overview (Parent Only) */}
      {isParent && children.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👨‍👩‍👧 My Children</Text>
          {children.map(child => (
            <TouchableOpacity
              key={child.email}
              onPress={() => navigation.navigate('ChildDetail', { childEmail: child.email })}
            >
              <Card style={styles.childCard}>
                <Avatar name={child.name} size={40} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.childName}>{child.name}</Text>
                  <Text style={styles.childUsername}>@{child.username}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.childBalance}>{formatRupee(child.balance)}</Text>
                  {child.spendingLimit && (
                    <Text style={styles.childLimit}>Limit: {formatRupee(child.spendingLimit)}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} style={{ marginLeft: 8 }} />
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Add Child Button for Parents */}
      {isParent && (
        <TouchableOpacity
          style={styles.addChildBtn}
          onPress={() => navigation.navigate('LinkChild')}
        >
          <Ionicons name="person-add-outline" size={20} color={COLORS.primary} />
          <Text style={styles.addChildText}>Link a Child Account</Text>
        </TouchableOpacity>
      )}

      {/* Spending Limit Bar (Child Only) */}
      {!isParent && user.spendingLimit && (
        <Card style={styles.limitCard}>
          <Text style={styles.limitTitle}>📊 Spending Limit</Text>
          <View style={styles.limitBar}>
            <View style={[styles.limitFill, {
              width: `${Math.min(100, ((user.spendingLimit - user.balance) / user.spendingLimit) * 100)}%`
            }]} />
          </View>
          <Text style={styles.limitText}>
            Limit: {formatRupee(user.spendingLimit)} per period
          </Text>
        </Card>
      )}

      {/* Recent Transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {txs.length === 0 ? (
          <Card style={styles.emptyTx}>
            <Ionicons name="receipt-outline" size={40} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No transactions yet.</Text>
            <Text style={styles.emptyText}>Send money to get started!</Text>
          </Card>
        ) : (
          txs.map(tx => (
            <Card key={tx.id} style={styles.txCard}>
              <View style={[styles.txIcon, {
                backgroundColor: txColor(tx, user.email) + '20'
              }]}>
                <Ionicons
                  name={tx.receiverEmail === user.email ? 'arrow-down' : 'arrow-up'}
                  size={18}
                  color={txColor(tx, user.email)}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.txName}>
                  {tx.receiverEmail === user.email ? tx.senderName : tx.receiverName}
                </Text>
                <Text style={styles.txDate}>{formatDate(tx.timestamp)}</Text>
                {tx.note ? <Text style={styles.txNote}>"{tx.note}"</Text> : null}
              </View>
              <Text style={[styles.txAmount, { color: txColor(tx, user.email) }]}>
                {txSign(tx, user.email)}{formatRupee(tx.amount)}
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
  header: {
    paddingTop: 56, paddingBottom: 28, paddingHorizontal: 24,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: SIZES.xl, fontWeight: '900', color: '#fff' },
  role: { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  balanceLabel: { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  balance: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  username: { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.7)', marginTop: 2, marginBottom: 20 },

  quickActions: { flexDirection: 'row', justifyContent: 'space-between' },
  qaBtn: {
    alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: RADIUS.md, paddingVertical: 12, paddingHorizontal: 10, flex: 1, marginHorizontal: 4,
  },
  qaText: { fontSize: SIZES.xs, color: '#fff', marginTop: 4, fontWeight: '600' },

  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.text },
  seeAll: { fontSize: SIZES.sm, color: COLORS.primary, fontWeight: '600' },

  pendingCard: {
    marginHorizontal: 16, marginTop: 16,
    borderColor: COLORS.parent, borderWidth: 2,
    backgroundColor: COLORS.parent + '10',
  },
  pendingTitle: { fontSize: SIZES.base, fontWeight: '800', color: COLORS.parent, marginBottom: 4 },
  pendingText: { fontSize: SIZES.sm, color: COLORS.text, marginBottom: 12 },
  pendingBtns: { flexDirection: 'row', gap: 10 },
  pendingBtn: { flex: 1, padding: 10, borderRadius: RADIUS.sm, alignItems: 'center' },
  pendingBtnText: { color: '#fff', fontWeight: '700', fontSize: SIZES.sm },

  childCard: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
    padding: 14,
  },
  childName: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text },
  childUsername: { fontSize: SIZES.sm, color: COLORS.textMuted },
  childBalance: { fontSize: SIZES.base, fontWeight: '800', color: COLORS.success },
  childLimit: { fontSize: SIZES.xs, color: COLORS.textMuted, marginTop: 2 },

  addChildBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 16, marginTop: 8,
    borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.primary,
    borderRadius: RADIUS.md, padding: 14, gap: 8,
  },
  addChildText: { fontSize: SIZES.base, color: COLORS.primary, fontWeight: '700' },

  limitCard: { marginHorizontal: 16, marginTop: 16 },
  limitTitle: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  limitBar: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  limitFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  limitText: { fontSize: SIZES.xs, color: COLORS.textMuted },

  emptyTx: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { color: COLORS.textMuted, fontSize: SIZES.sm, marginTop: 8 },

  txCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, padding: 14 },
  txIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  txName: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text },
  txDate: { fontSize: SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  txNote: { fontSize: SIZES.xs, color: COLORS.textMuted, fontStyle: 'italic', marginTop: 2 },
  txAmount: { fontSize: SIZES.base, fontWeight: '800' },
});
