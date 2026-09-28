import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {ReportStatus} from '../types';
import {statusMeta} from '../constants/catalog';

/** Etiqueta de estado con semáforo de color (F06/F08). */
export default function StatusBadge({status}: {status: ReportStatus}) {
  const meta = statusMeta(status);
  return (
    <View style={[styles.badge, {backgroundColor: meta.soft}]}>
      <View style={[styles.dot, {backgroundColor: meta.color}]} />
      <Text style={[styles.label, {color: meta.color}]}>{meta.label}</Text>
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
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
  },
});
