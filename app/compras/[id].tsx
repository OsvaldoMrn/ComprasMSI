import { Redirect, router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CompraForm } from '../../src/components/compras/CompraForm';
import { getCompraById } from '../../src/database/repositories/comprasRepository';
import { calculateFinancialSummary } from '../../src/features/compras/calculations';
import { useComprasMSI } from '../../src/features/compras/hooks';
import { useSQLiteContext } from 'expo-sqlite';
import type { CompraMSI } from '../../src/features/compras/types';

export default function CompraDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const database = useSQLiteContext();
  const { update, archive } = useComprasMSI();
  const [compra, setCompra] = useState<CompraMSI | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: currentCompra.nombreProducto }} />
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
            <Text style={styles.installmentTitle}>Pago {installment.number}</Text>
            <Text>{installment.dueDate}</Text>
            <Text>{formatMoney(installment.amountMinor)}</Text>
            <Text style={styles.status}>{statusLabel(installment.status)}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.sectionTitle}>Datos de la compra</Text>
      <CompraForm
        initialValue={currentCompra}
        submitLabel="Guardar cambios"
        scrollable={false}
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
  );

  async function archiveAndGo() {
    await archive(currentCompra.id);
    router.replace('/compras');
  }
}

function formatMoney(amountMinor: number): string {
  return `$${(amountMinor / 100).toFixed(2)} MXN`;
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
  container: { flex: 1 },
  content: { paddingBottom: 24 },
  title: { color: '#0f172a', fontSize: 24, fontWeight: '800', paddingHorizontal: 20, paddingTop: 18 },
  summary: { backgroundColor: '#eff6ff', borderRadius: 8, gap: 12, margin: 20, padding: 16 },
  metric: { gap: 2 },
  metricLabel: { color: '#475569', fontSize: 13 },
  metricValue: { color: '#0f172a', fontSize: 18, fontWeight: '700' },
  sectionTitle: { color: '#0f172a', fontSize: 18, fontWeight: '700', paddingHorizontal: 20, paddingTop: 8 },
  disclaimer: { color: '#64748b', fontSize: 13, paddingHorizontal: 20, paddingTop: 6 },
  schedule: { gap: 8, padding: 20 },
  installment: { backgroundColor: '#f8fafc', borderColor: '#cbd5e1', borderRadius: 8, borderWidth: 1, gap: 3, padding: 12 },
  installmentTitle: { color: '#0f172a', fontWeight: '700' },
  status: { color: '#475569', fontSize: 13 },
  loader: { flex: 1 },
  notFound: { color: '#475569', padding: 24 },
  deleteButton: { alignItems: 'center', borderColor: '#dc2626', borderRadius: 8, borderWidth: 1, margin: 20, minHeight: 48, justifyContent: 'center' },
  deleteText: { color: '#b91c1c', fontWeight: '700' },
});
