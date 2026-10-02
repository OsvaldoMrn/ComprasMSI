import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { calculateActiveMonthlyCommitment } from '../../src/features/compras/calculations';
import { useComprasMSI } from '../../src/features/compras/hooks';
import { formatMoney } from '../../src/lib/money';
import { colors, radius, spacing } from '../../src/constants/theme';

export default function HomeScreen() {
  const { compras, isLoading } = useComprasMSI();
  const insets = useSafeAreaInsets();
  const monthlyCommitment = calculateActiveMonthlyCommitment(compras);
  const activeCount = compras.filter((compra) => compra.estado === 'active').length;

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + 40 }]}>
      <Text style={styles.kicker}>PANEL DE COMPROMISOS</Text>
      {isLoading ? <Text style={styles.muted}>Cargando...</Text> : (
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.label}>COMPROMISO ESTE MES</Text>
            <Text style={styles.value}>{formatMoney(monthlyCommitment)}</Text>
          </View>
          <View style={styles.divider} />
          <View>
            <Text style={styles.label}>COMPRAS ACTIVAS</Text>
            <Text style={styles.count}>{activeCount}</Text>
          </View>
        </View>
      )}
      <Link href="/compras/nueva" style={styles.button}>+  Agregar compra</Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { backgroundColor: colors.canvas, flex: 1 },
  content: { gap: spacing.lg, padding: spacing.lg, paddingBottom: 40, paddingTop: spacing.xl },
  kicker: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  summaryCard: { backgroundColor: colors.primary, borderRadius: radius.lg, gap: spacing.lg, padding: spacing.lg },
  label: { color: '#C9D6FF', fontSize: 12, fontWeight: '800' },
  value: { color: colors.ink, fontSize: 34, fontWeight: '900', marginTop: spacing.xs },
  count: { color: colors.ink, fontSize: 28, fontWeight: '900', marginTop: spacing.xs },
  divider: { backgroundColor: '#4B73E1', height: 1 },
  button: { backgroundColor: colors.primaryDark, borderRadius: radius.md, color: colors.ink, fontSize: 16, fontWeight: '900', overflow: 'hidden', padding: 17, textAlign: 'center' },
  muted: { color: colors.muted, fontSize: 14 },
});
