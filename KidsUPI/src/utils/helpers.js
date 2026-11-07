// src/utils/helpers.js

import { v4 as uuidv4 } from 'uuid';

/** Generate a 6-digit OTP */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Generate a unique transaction ID */
export function generateTxId() {
  return 'KU' + Date.now().toString(36).toUpperCase() + uuidv4().split('-')[0].toUpperCase();
}

/** Format a number as rupee currency */
export function formatRupee(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Format a date/time nicely */
export function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/** Mask email for display */
export function maskEmail(email) {
  if (!email) return '';
  const [user, domain] = email.split('@');
  const masked = user.length <= 3
    ? user[0] + '***'
    : user.slice(0, 3) + '***';
  return masked + '@' + domain;
}

/** Validate email format */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Validate amount (positive number) */
export function isValidAmount(amount) {
  const n = parseFloat(amount);
  return !isNaN(n) && n > 0;
}

/** Generate a QR payload string for receiving money */
export function buildQRPayload(user) {
  return JSON.stringify({
    type: 'KIDSUPI_PAY',
    email: user.email,
    username: user.username,
    name: user.name,
  });
}

/** Parse a QR payload string */
export function parseQRPayload(str) {
  try {
    const data = JSON.parse(str);
    if (data.type === 'KIDSUPI_PAY') return data;
    return null;
  } catch {
    return null;
  }
}

/** Generate a 6-character "tap code" for NFC-like proximity pay */
export function generateTapCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** Get color for transaction (green = received, red = sent) */
export function txColor(tx, currentEmail) {
  return tx.receiverEmail === currentEmail ? '#22c55e' : '#ef4444';
}

/** Get sign for transaction */
export function txSign(tx, currentEmail) {
  return tx.receiverEmail === currentEmail ? '+' : '-';
}
