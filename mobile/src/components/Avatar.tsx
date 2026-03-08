import React, { useState } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: number;
  borderColor?: string;
  borderWidth?: number;
}

export function Avatar({ uri, name, size = 40, borderColor, borderWidth = 0 }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const initial = (name?.[0] ?? '?').toUpperCase();
  const radius = size / 2;

  if (!uri || failed) {
    return (
      <View
        style={[
          styles.fallback,
          {
            width: size,
            height: size,
            borderRadius: radius,
            borderColor: borderColor ?? colors.cardBorder,
            borderWidth: borderWidth || 1.5,
          },
        ]}
      >
        <Text style={[styles.initial, { fontSize: size * 0.38 }]}>{initial}</Text>
      </View>
    );
  }

  return (
    <View style={{ width: size, height: size, borderRadius: radius, borderColor, borderWidth, overflow: 'hidden' }}>
      <Image
        source={{ uri }}
        style={{ width: size - borderWidth * 2, height: size - borderWidth * 2, borderRadius: radius }}
        onError={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    fontWeight: '700',
    color: colors.brand,
  },
});
