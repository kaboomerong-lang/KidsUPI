// src/screens/main/TransactionsScreen.js

import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import { COLORS, SIZES, RADIUS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { getTransactionsForUser } from '../../utils/storage';
import { formatRupee, formatDate, txColor, txSign } from '../../utils/helpers';

export default function TransactionsScreen({ navigation }) {
  const { user } = useAuth();
  const [txs, setTxs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const data = await getTransactionsForUser(user.email);
    setTxs(data);
  }, [user?.email]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderItem = ({ item: tx }) => (
    <Card style={styles.txCard}>
      <View style={[styles.txIcon, { backgroundColor: txColor(tx, user.email) + '20' }]}>
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
        <View style={styles.methodTag}>
          <Ionicons
            name={{ email: 'mail-outline', username: 'at-outline', tapcode: 'phone-portrait-outline', qr: 'qr-code-outline' }[tx.method] || 'swap-horizontal-outline'}
            size={10}
            color={COLORS.textMuted}
          />
          <Text style={styles.methodText}>{tx.method || 'transfer'}</Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.txAmount, { color: txColor(tx, user.email) }]}>
          {txSign(tx, user.email)}{formatRupee(tx.amount)}
        </Text>
        <Text style={styles.txId}>{tx.id}</Text>
      </View>
    </Card>
  );

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Transactions</Text>
        <Text style={styles.count}>{txs.length} total</Text>
      </View>

      <FlatList
        data={txs}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingBottom: 16, paddingHorizontal: 24,
    backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title: { fontSize: SIZES.xl, fontWeight: '900', color: COLORS.text },
  count: { fontSize: SIZES.sm, color: COLORS.textMuted },

  list: { padding: 16 },

  txCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, padding: 14 },
  txIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  txName: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text },
  txDate: { fontSize: SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  txNote: { fontSize: SIZES.xs, color: COLORS.textMuted, fontStyle: 'italic', marginTop: 2 },
  methodTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  methodText: { fontSize: SIZES.xs, color: COLORS.textMuted },
  txAmount: { fontSize: SIZES.base, fontWeight: '800' },
  txId: { fontSize: 9, color: COLORS.textLight, marginTop: 2 },

  empty: { flex: 1, alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: SIZES.base, color: COLORS.textMuted, marginTop: 12 },
});
