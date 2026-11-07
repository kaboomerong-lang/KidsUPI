// src/screens/main/ProfileScreen.js

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Avatar from '../../components/Avatar';
import { COLORS, SIZES, RADIUS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { formatRupee, maskEmail } from '../../utils/helpers';

const MenuItem = ({ icon, label, sublabel, onPress, iconColor = COLORS.primary, right, dangerous }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={[styles.menuIcon, { backgroundColor: (iconColor) + '15' }]}>
      <Ionicons name={icon} size={20} color={iconColor} />
    </View>
    <View style={{ flex: 1, marginLeft: 12 }}>
      <Text style={[styles.menuLabel, dangerous && { color: COLORS.danger }]}>{label}</Text>
      {sublabel && <Text style={styles.menuSub}>{sublabel}</Text>}
    </View>
    {right ?? <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />}
  </TouchableOpacity>
);

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  if (!user) return null;

  const isParent = user.role === 'parent';
  const gradientColors = isParent ? ['#F97316', '#FB923C'] : ['#6C63FF', '#A78BFA'];

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Header */}
      <LinearGradient colors={gradientColors} style={styles.header}>
        <Avatar name={user.name} size={80} style={{ marginBottom: 12 }} />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.username}>@{user.username}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{isParent ? '👨‍👩‍👧 Parent' : '🧒 Child'}</Text>
        </View>
      </LinearGradient>

      {/* Balance Card */}
      <Card style={styles.balanceCard} shadow="md">
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balance}>{formatRupee(user.balance)}</Text>
        <Text style={styles.balanceEmail}>{maskEmail(user.email)}</Text>
      </Card>

      {/* Account Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Details</Text>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <MenuItem
            icon="mail-outline"
            label="Email"
            sublabel={user.email}
            onPress={() => {}}
            right={<View />}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="person-outline"
            label="Username"
            sublabel={'@' + user.username}
            onPress={() => {}}
            right={<View />}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="calendar-outline"
            label="Member Since"
            sublabel={new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            onPress={() => {}}
            right={<View />}
          />
        </Card>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <MenuItem icon="swap-horizontal-outline" label="Transactions" sublabel="View all activity" onPress={() => navigation.navigate('Transactions')} />
          <View style={styles.divider} />
          <MenuItem icon="paper-plane-outline" label="Send Money" onPress={() => navigation.navigate('Send')} />
          <View style={styles.divider} />
          <MenuItem icon="download-outline" label="Receive Money" onPress={() => navigation.navigate('Receive')} />
          <View style={styles.divider} />
          <MenuItem icon="phone-portrait-outline" label="Tap Pay" sublabel="Proximity pay" onPress={() => navigation.navigate('Tap')} />
          {isParent && (
            <>
              <View style={styles.divider} />
              <MenuItem
                icon="people-outline"
                label="Link Child Account"
                iconColor={COLORS.parent}
                onPress={() => navigation.navigate('LinkChild')}
              />
            </>
          )}
        </Card>
      </View>

      {/* Info */}
      <View style={styles.section}>
        <Card style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color={COLORS.info} style={{ marginBottom: 8 }} />
          <Text style={styles.infoTitle}>About KidsUPI</Text>
          <Text style={styles.infoText}>
            KidsUPI is a 100% simulated payment app for educational purposes only.
            No real money is transferred. This app is designed to teach children how
            digital payments work in a completely safe environment.
          </Text>
          <Text style={[styles.infoText, { marginTop: 8, color: COLORS.danger, fontWeight: '700' }]}>
            ⚠️ This app does NOT connect to any real UPI, bank, or payment network.
          </Text>
        </Card>
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <MenuItem
            icon="log-out-outline"
            label="Logout"
            iconColor={COLORS.danger}
            onPress={handleLogout}
            dangerous
            right={<View />}
          />
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingTop: 60, paddingBottom: 32, paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  name: { fontSize: SIZES.xxl, fontWeight: '900', color: '#fff' },
  username: { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: RADIUS.full,
    paddingHorizontal: 14, paddingVertical: 4, marginTop: 8,
  },
  roleText: { fontSize: SIZES.sm, color: '#fff', fontWeight: '700' },

  balanceCard: { margin: 16, padding: 24, alignItems: 'center' },
  balanceLabel: { fontSize: SIZES.sm, color: COLORS.textMuted, marginBottom: 4 },
  balance: { fontSize: 36, fontWeight: '900', color: COLORS.text },
  balanceEmail: { fontSize: SIZES.sm, color: COLORS.textMuted, marginTop: 4 },

  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },

  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text },
  menuSub: { fontSize: SIZES.sm, color: COLORS.textMuted, marginTop: 1 },
  divider: { height: 1, backgroundColor: COLORS.border, marginLeft: 68 },

  infoCard: { padding: 20, backgroundColor: COLORS.info + '10', borderColor: COLORS.info },
  infoTitle: { fontSize: SIZES.base, fontWeight: '800', color: COLORS.info, marginBottom: 8 },
  infoText: { fontSize: SIZES.sm, color: COLORS.text, lineHeight: 20 },
});
