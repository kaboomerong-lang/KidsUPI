// src/utils/storage.js
// Handles all local AsyncStorage operations for KidsUPI

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USERS: 'kidsupi_users',
  CURRENT_USER: 'kidsupi_current_user',
  TRANSACTIONS: 'kidsupi_transactions',
  PARENT_LINKS: 'kidsupi_parent_links',
  OTP_STORE: 'kidsupi_otp_store',
};

// ─── Users ───────────────────────────────────────────────────────────────────

export async function getAllUsers() {
  const raw = await AsyncStorage.getItem(KEYS.USERS);
  return raw ? JSON.parse(raw) : {};
}

export async function saveUser(user) {
  const users = await getAllUsers();
  users[user.email] = user;
  await AsyncStorage.setItem(KEYS.USERS, JSON.stringify(users));
}

export async function getUserByEmail(email) {
  const users = await getAllUsers();
  return users[email] || null;
}

export async function getUserByUsername(username) {
  const users = await getAllUsers();
  return Object.values(users).find(u => u.username === username) || null;
}

export async function updateUserBalance(email, newBalance) {
  const users = await getAllUsers();
  if (users[email]) {
    users[email].balance = newBalance;
    await AsyncStorage.setItem(KEYS.USERS, JSON.stringify(users));
  }
}

export async function updateUser(email, updates) {
  const users = await getAllUsers();
  if (users[email]) {
    users[email] = { ...users[email], ...updates };
    await AsyncStorage.setItem(KEYS.USERS, JSON.stringify(users));
    return users[email];
  }
  return null;
}

// ─── Current Session ──────────────────────────────────────────────────────────

export async function setCurrentUser(email) {
  await AsyncStorage.setItem(KEYS.CURRENT_USER, email);
}

export async function getCurrentUserEmail() {
  return await AsyncStorage.getItem(KEYS.CURRENT_USER);
}

export async function getCurrentUser() {
  const email = await getCurrentUserEmail();
  if (!email) return null;
  return await getUserByEmail(email);
}

export async function logout() {
  await AsyncStorage.removeItem(KEYS.CURRENT_USER);
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function getAllTransactions() {
  const raw = await AsyncStorage.getItem(KEYS.TRANSACTIONS);
  return raw ? JSON.parse(raw) : [];
}

export async function addTransaction(tx) {
  const txs = await getAllTransactions();
  txs.unshift(tx); // newest first
  await AsyncStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(txs));
}

export async function getTransactionsForUser(email) {
  const txs = await getAllTransactions();
  return txs.filter(t => t.senderEmail === email || t.receiverEmail === email);
}

// ─── Parent–Child Links ───────────────────────────────────────────────────────

export async function getParentLinks() {
  const raw = await AsyncStorage.getItem(KEYS.PARENT_LINKS);
  return raw ? JSON.parse(raw) : [];
}

export async function addParentLink(parentEmail, childEmail) {
  const links = await getParentLinks();
  const exists = links.find(l => l.parentEmail === parentEmail && l.childEmail === childEmail);
  if (!exists) {
    links.push({ parentEmail, childEmail, linkedAt: Date.now() });
    await AsyncStorage.setItem(KEYS.PARENT_LINKS, JSON.stringify(links));
  }
}

export async function getChildrenOf(parentEmail) {
  const links = await getParentLinks();
  const emails = links.filter(l => l.parentEmail === parentEmail).map(l => l.childEmail);
  const children = [];
  for (const e of emails) {
    const u = await getUserByEmail(e);
    if (u) children.push(u);
  }
  return children;
}

export async function getParentOf(childEmail) {
  const links = await getParentLinks();
  const link = links.find(l => l.childEmail === childEmail);
  if (!link) return null;
  return await getUserByEmail(link.parentEmail);
}

export async function hasPendingParentRequest(childEmail) {
  const users = await getAllUsers();
  return users[childEmail]?.pendingParentEmail || null;
}

export async function requestParentLink(parentEmail, childEmail) {
  // Store a pending request on the child's account
  await updateUser(childEmail, { pendingParentEmail: parentEmail });
}

export async function acceptParentLink(childEmail) {
  const child = await getUserByEmail(childEmail);
  if (child?.pendingParentEmail) {
    await addParentLink(child.pendingParentEmail, childEmail);
    await updateUser(childEmail, { pendingParentEmail: null });
    return true;
  }
  return false;
}

export async function rejectParentLink(childEmail) {
  await updateUser(childEmail, { pendingParentEmail: null });
}

// ─── OTP ─────────────────────────────────────────────────────────────────────
// Simulated OTP: stored locally (in a real app this would be server-side)

export async function storeOTP(email, otp) {
  const store = await getOTPStore();
  store[email] = { otp, createdAt: Date.now() };
  await AsyncStorage.setItem(KEYS.OTP_STORE, JSON.stringify(store));
}

export async function getOTPStore() {
  const raw = await AsyncStorage.getItem(KEYS.OTP_STORE);
  return raw ? JSON.parse(raw) : {};
}

export async function verifyOTP(email, otp) {
  const store = await getOTPStore();
  const record = store[email];
  if (!record) return false;
  const expired = Date.now() - record.createdAt > 5 * 60 * 1000; // 5 min
  if (expired) return false;
  return record.otp === otp;
}

export async function clearOTP(email) {
  const store = await getOTPStore();
  delete store[email];
  await AsyncStorage.setItem(KEYS.OTP_STORE, JSON.stringify(store));
}

// ─── Spending Limits ──────────────────────────────────────────────────────────

export async function setSpendingLimit(childEmail, limit) {
  await updateUser(childEmail, { spendingLimit: limit });
}

export async function getSpendingLimit(childEmail) {
  const user = await getUserByEmail(childEmail);
  return user?.spendingLimit ?? null;
}
