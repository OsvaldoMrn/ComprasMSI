import { Redirect, router, Stack, useLocalSearchParams } from 'expo-router';
import { useRef, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CompraForm } from '../../src/components/compras/CompraForm';
import { getCompraById } from '../../src/database/repositories/comprasRepository';
import { calculateFinancialSummary } from '../../src/features/compras/calculations';
import { useComprasMSI } from '../../src/features/compras/hooks';
import { useSQLiteContext } from 'expo-sqlite';
import type { CompraMSI } from '../../src/features/compras/types';
import { colors, radius, spacing } from '../../src/constants/theme';
import { formatMoney } from '../../src/lib/money';

export default function CompraDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const database = useSQLiteContext();
  const { update, archive } = useComprasMSI();
  const [compra, setCompra] = useState<CompraMSI | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<ScrollView>(null);
  const scrollOffset = useRef(0);

  useEffect(() => {
    async function load() {
      const purchase = await getCompraById(database, Number(id));
      setCompra(purchase);
      setIsLoading(false);
    }
    void load();
  }, [database, id]);

  if (isLoading) return <ActivityIndicator style={styles.loader} />;
  if (!compra) return <Redirect href="/" />;
  const currentCompra = compra;
  const summary = calculateFinancialSummary(currentCompra);

  function revealField(input: TextInput) {
    requestAnimationFrame(() => {
      setTimeout(() => {
        input.measureInWindow((_x, y) => {
          const targetOffset = Math.max(0, scrollOffset.current + y - 96);
          scrollRef.current?.scrollTo({ y: targetOffset, animated: true });
        });
      }, 220);
    });
  }

  return (
    <KeyboardAvoidingView style={styles.keyboardContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" onScroll={(event) => { scrollOffset.current = event.nativeEvent.contentOffset.y; }} scrollEventThrottle={16}>
      <Stack.Screen options={{ title: currentCompra.nombreProducto }} />
      <Text style={styles.kicker}>DETALLE DE COMPRA</Text>
      <Text style={styles.title}>{currentCompra.nombreProducto}</Text>
      <View style={styles.summary}>
        <Metric label="Mensualidad" value={formatMoney(summary.monthlyAmountMinor)} />
        <Metric label="Cargos con fecha cumplida" value={`${summary.elapsedInstallments} de ${currentCompra.mesesAPagar}`} />
        <Metric label="Deuda MSI proyectada" value={formatMoney(summary.remainingDebtMinor)} />
        <Metric label="Termina" value={summary.completionDate} />
      </View>
      <Text style={styles.sectionTitle}>Calendario de cargos MSI</Text>
      <Text style={styles.disclaimer}>Las fechas y montos son compromisos proyectados; no representan pagos bancarios confirmados.</Text>
      <View style={styles.schedule}>
        {summary.installments.map((installment) => (
          <View key={installment.number} style={styles.installment}>
            <View>
              <Text style={styles.installmentTitle}>Cargo {installment.number}</Text>
              <Text style={styles.installmentDate}>{installment.dueDate}</Text>
            </View>
            <View style={styles.installmentRight}>
              <Text style={styles.installmentAmount}>{formatMoney(installment.amountMinor)}</Text>
              <Text style={styles.status}>{statusLabel(installment.status)}</Text>
            </View>
          </View>
        ))}
      </View>
      <Text style={styles.sectionTitle}>Datos de la compra</Text>
      <CompraForm
        initialValue={currentCompra}
        submitLabel="Guardar cambios"
        scrollable={false}
        onFieldFocus={revealField}
        onSubmit={async (value) => { await update(currentCompra.id, value); router.back(); }}
      />
      <Pressable
        style={styles.deleteButton}
        onPress={() => Alert.alert('Archivar compra', 'La compra desaparecerá de la lista activa.', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Archivar', style: 'destructive', onPress: () => void archiveAndGo() },
        ])}
      >
        <Text style={styles.deleteText}>Archivar compra</Text>
      </Pressable>
    </ScrollView>
    </KeyboardAvoidingView>
  );

  async function archiveAndGo() {
    await archive(currentCompra.id);
    router.replace('/compras');
  }
}

function statusLabel(status: 'upcoming' | 'current' | 'elapsed'): string {
  if (status === 'elapsed') return 'Cargo con fecha cumplida';
  if (status === 'current') return 'Cargo de hoy';
  return 'Cargo próximo';
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1 },
  container: { backgroundColor: colors.canvas, flex: 1 },
  content: { paddingBottom: 340 },
  kicker: { color: colors.muted, fontSize: 11, fontWeight: '800', paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  title: { color: colors.ink, fontSize: 30, fontWeight: '900', paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  summary: { backgroundColor: colors.primary, borderRadius: radius.lg, gap: spacing.md, margin: spacing.lg, padding: spacing.lg },
  metric: { gap: 2 },
  metricLabel: { color: '#C9D6FF', fontSize: 12, fontWeight: '800' },
  metricValue: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: '900', paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  disclaimer: { color: colors.muted, fontSize: 13, lineHeight: 19, paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  schedule: { gap: spacing.sm, padding: spacing.lg },
  installment: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md },
  installmentTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  installmentDate: { color: colors.muted, fontSize: 13, marginTop: 3 },
  installmentRight: { alignItems: 'flex-end', gap: 3 },
  installmentAmount: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  status: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  loader: { flex: 1 },
  notFound: { color: colors.muted, padding: spacing.lg },
  deleteButton: { alignItems: 'center', borderColor: colors.danger, borderRadius: radius.sm, borderWidth: 1, margin: spacing.lg, minHeight: 48, justifyContent: 'center' },
  deleteText: { color: colors.danger, fontWeight: '800' },
});
