import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { calculateActiveMonthlyCommitment, calculateActiveRemainingDebt, calculateMonthlyProjection, calculateUpcomingCharges } from '../src/features/compras/calculations';
import { useComprasMSI } from '../src/features/compras/hooks';

export default function HomeScreen() {
  const { compras, isLoading } = useComprasMSI();
  const monthlyCommitment = calculateActiveMonthlyCommitment(compras);
  const remainingDebt = calculateActiveRemainingDebt(compras);
  const upcomingCharges = calculateUpcomingCharges(compras);
  const monthlyProjection = calculateMonthlyProjection(compras);

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Compras MSI</Text>
      <Text style={styles.subtitle}>Control local de tus compras a meses sin intereses.</Text>
      {isLoading ? <Text style={styles.count}>Cargando...</Text> : (
        <View style={styles.metrics}>
          <Metric label="Compromiso mensual actual" value={formatMoney(monthlyCommitment)} />
          <Metric label="Deuda MSI proyectada" value={formatMoney(remainingDebt)} />
          <Text style={styles.count}>{compras.filter((compra) => compra.estado === 'active').length} compra(s) activa(s)</Text>
        </View>
      )}
      {!isLoading ? <>
        <Text style={styles.sectionTitle}>Próximos cargos MSI</Text>
        {upcomingCharges.length === 0 ? <Text style={styles.muted}>No hay cargos proyectados en los próximos 30 días.</Text> : upcomingCharges.map((charge) => (
          <View key={`${charge.compraId}-${charge.number}`} style={styles.charge}>
            <View>
              <Text style={styles.chargeTitle}>{charge.nombreProducto} · Pago {charge.number}</Text>
              <Text style={styles.muted}>{charge.dueDate}</Text>
            </View>
            <Text style={styles.chargeAmount}>{formatMoney(charge.amountMinor)}</Text>
          </View>
        ))}
        <Text style={styles.sectionTitle}>Proyección de compromisos</Text>
        {monthlyProjection.map((projection) => (
          <View key={projection.month} style={styles.projection}>
            <Text style={styles.projectionMonth}>{formatMonth(projection.month)}</Text>
            <Text>{formatMoney(projection.totalMinor)} · {projection.chargeCount} cargo(s)</Text>
          </View>
        ))}
      </> : null}
      <Link href="/compras/nueva" style={styles.button}>Agregar compra MSI</Link>
      <Link href="/compras" style={styles.link}>Ver compras</Link>
    </ScrollView>
  );
}

function formatMoney(amountMinor: number): string {
  return `$${(amountMinor / 100).toFixed(2)} MXN`;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function formatMonth(month: string): string {
  const [year, monthNumber] = month.split('-');
  const names = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${names[Number(monthNumber) - 1]} ${year}`;
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  content: { gap: 18, padding: 24, paddingBottom: 40 },
  title: { color: '#0f172a', fontSize: 30, fontWeight: '800', marginTop: 30 },
  subtitle: { color: '#475569', fontSize: 16 },
  metrics: { backgroundColor: '#eff6ff', borderRadius: 8, gap: 16, marginTop: 20, padding: 16 },
  metric: { gap: 2 },
  metricLabel: { color: '#475569', fontSize: 13 },
  metricValue: { color: '#0f172a', fontSize: 22, fontWeight: '800' },
  count: { color: '#1e293b', fontSize: 16, fontWeight: '600' },
  sectionTitle: { color: '#0f172a', fontSize: 19, fontWeight: '800', marginTop: 12 },
  muted: { color: '#64748b', fontSize: 14 },
  charge: { alignItems: 'center', borderBottomColor: '#e2e8f0', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  chargeTitle: { color: '#0f172a', fontSize: 15, fontWeight: '700' },
  chargeAmount: { color: '#0f172a', fontSize: 16, fontWeight: '700' },
  projection: { alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, padding: 12 },
  projectionMonth: { color: '#0f172a', fontWeight: '700' },
  button: { backgroundColor: '#1d4ed8', borderRadius: 8, color: '#ffffff', fontSize: 16, fontWeight: '700', padding: 15, textAlign: 'center' },
  link: { color: '#1d4ed8', fontSize: 16, textAlign: 'center' },
});
