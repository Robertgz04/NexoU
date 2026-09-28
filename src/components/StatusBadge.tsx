import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ReportStatus } from '../types';
import { statusMeta } from '../constants/catalog';

/** Etiqueta de estado con semáforo de color e icono (mockups F06/F08). */
export default function StatusBadge({ status }: { status: ReportStatus }) {
  const meta = statusMeta(status);
  return (
    <View style={[styles.badge, { backgroundColor: meta.soft }]}>
      <Text style={[styles.icon, { color: meta.color }]}>{meta.icon}</Text>
      <Text style={[styles.label, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  icon: {
    fontSize: 11,
    fontWeight: '800',
    marginRight: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});
