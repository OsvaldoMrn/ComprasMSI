import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { calculateInstallments, calculateMonthlyProjection, calculateUpcomingCharges } from '../../src/features/compras/calculations';
import { useComprasMSI } from '../../src/features/compras/hooks';
import { formatMoney } from '../../src/lib/money';
import { getLocalDateISO } from '../../src/lib/dates';
import { colors, radius, spacing } from '../../src/constants/theme';

export default function CargosScreen() {
  const { compras, isLoading } = useComprasMSI();
  const insets = useSafeAreaInsets();
  const upcomingCharges = calculateUpcomingCharges(compras);
  const projections = calculateMonthlyProjection(compras);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(projections[0]?.month ?? null);

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + 48 }]}>
      <Text style={styles.kicker}>VISTA GENERAL</Text>
      <Text style={styles.title}>Cargos MSI</Text>
      <Text style={styles.subtitle}>Lo que viene en los próximos 30 días.</Text>
      {isLoading ? <Text style={styles.muted}>Cargando...</Text> : upcomingCharges.length === 0 ? (
        <View style={styles.empty}><Text style={styles.emptyTitle}>Todo despejado</Text><Text style={styles.muted}>No hay cargos proyectados en los próximos 30 días.</Text></View>
      ) : upcomingCharges.map((charge) => (
        <Link key={`${charge.compraId}-${charge.number}`} href={{ pathname: '/compras/[id]', params: { id: charge.compraId.toString() } }} asChild>
          <Pressable style={styles.charge}>
            <View style={styles.chargeCopy}>
              <Text style={styles.chargeTitle}>{charge.nombreProducto}</Text>
              <Text style={styles.chargeMeta}>Cargo {charge.number}/{charge.totalInstallments}  ·  {charge.dueDate}</Text>
            </View>
            <Text style={styles.chargeAmount}>{formatMoney(charge.amountMinor)}</Text>
          </Pressable>
        </Link>
      ))}
      <Text style={styles.sectionTitle}>Proyección de compromisos</Text>
      <Text style={styles.muted}>Toca un mes para ver qué compras lo componen.</Text>
      <View style={styles.projectionList}>
        {projections.map((projection) => {
          const expanded = expandedMonth === projection.month;
          const monthCharges = compras
            .filter((compra) => compra.estado === 'active')
            .flatMap((compra) => calculateInstallments(compra, getLocalDateISO()).map((installment) => ({ ...installment, nombreProducto: compra.nombreProducto, compraId: compra.id, totalInstallments: compra.mesesAPagar })))
            .filter((charge) => charge.dueDate.startsWith(projection.month));
          return (
            <View key={projection.month} style={styles.projectionBlock}>
              <Pressable style={styles.projectionRow} onPress={() => setExpandedMonth(expanded ? null : projection.month)}>
                <View><Text style={styles.month}>{formatMonth(projection.month)}</Text><Text style={styles.muted}>{projection.chargeCount} cargo(s)</Text></View>
                <View style={styles.projectionRight}><Text style={styles.projectionAmount}>{formatMoney(projection.totalMinor)}</Text><Text style={styles.chevron}>{expanded ? '−' : '+'}</Text></View>
              </Pressable>
              {expanded ? <View style={styles.breakdown}>
                {monthCharges.length === 0 ? <Text style={styles.muted}>Sin cargos proyectados.</Text> : monthCharges.map((charge) => <Link key={`${charge.compraId}-${charge.number}`} href={{ pathname: '/compras/[id]', params: { id: charge.compraId.toString() } }} style={styles.breakdownItem}>{charge.nombreProducto} · Cargo {charge.number}/{charge.totalInstallments}  {formatMoney(charge.amountMinor)}</Link>)}
              </View> : null}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function formatMonth(month: string): string {
  const [year, monthNumber] = month.split('-');
  const names = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${names[Number(monthNumber) - 1]} ${year}`;
}

const styles = StyleSheet.create({
  scrollView: { backgroundColor: colors.canvas, flex: 1 },
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: 48, paddingTop: spacing.xl },
  kicker: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  title: { color: colors.ink, fontSize: 30, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 15, marginTop: -spacing.sm },
  charge: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md },
  chargeCopy: { flex: 1, gap: 4 },
  chargeTitle: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  chargeMeta: { color: colors.muted, fontSize: 13 },
  chargeAmount: { color: colors.primary, fontSize: 16, fontWeight: '900', marginLeft: spacing.sm },
  sectionTitle: { color: colors.ink, fontSize: 21, fontWeight: '900', marginTop: spacing.md },
  projectionList: { gap: spacing.sm, marginTop: spacing.xs },
  projectionBlock: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, overflow: 'hidden' },
  projectionRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md },
  month: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  projectionRight: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  projectionAmount: { color: colors.primary, fontSize: 16, fontWeight: '900' },
  chevron: { color: colors.primary, fontSize: 22, fontWeight: '800', width: 20 },
  breakdown: { backgroundColor: colors.canvas, borderTopColor: colors.line, borderTopWidth: 1, gap: spacing.sm, padding: spacing.md },
  breakdownItem: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  empty: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, gap: spacing.xs, padding: spacing.lg },
  emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
});
