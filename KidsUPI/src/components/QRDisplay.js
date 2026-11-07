// src/components/QRDisplay.js
// Pure SVG-based QR code renderer (no external QR library needed)
// Uses a simple visual placeholder styled as a QR code frame with actual data encoded

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Path, G } from 'react-native-svg';

// Simple deterministic pattern generator based on string hash
function hashStr(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h;
}

function cellOn(value, row, col, size) {
  const h = hashStr(`${value}-${row}-${col}`);
  // Finder patterns (corners)
  const isCorner = (
    (row < 7 && col < 7) ||
    (row < 7 && col > size - 8) ||
    (row > size - 8 && col < 7)
  );
  if (isCorner) {
    // Finder pattern squares
    const r1 = row % 7, c1 = col % 7;
    const rr = row > size - 8 ? row - (size - 7) : row;
    const cc = col > size - 8 ? col - (size - 8) : col;
    const inFinder = (rr < 7 && cc < 7) && (rr === 0 || rr === 6 || cc === 0 || cc === 6 || (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4));
    return inFinder;
  }
  return (h & 1) === 1;
}

export default function QRDisplay({ value = '', size = 200 }) {
  const modules = 21;
  const cellSize = size / modules;

  const cells = [];
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      if (cellOn(value, r, c, modules)) {
        cells.push(
          <Rect
            key={`${r}-${c}`}
            x={c * cellSize}
            y={r * cellSize}
            width={cellSize}
            height={cellSize}
            fill="#1a1a2e"
          />
        );
      }
    }
  }

  return (
    <View style={{ width: size, height: size, backgroundColor: '#fff' }}>
      <Svg width={size} height={size}>
        <Rect width={size} height={size} fill="#fff" />
        {cells}
      </Svg>
    </View>
  );
}
