import { Link } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useComprasMSI } from '../../src/features/compras/hooks';

export default function ComprasScreen() {
  const { compras, isLoading, error } = useComprasMSI();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Compras MSI</Text>
        <Link href="/compras/nueva" asChild>
          <Pressable style={styles.addButton}><Text style={styles.addButtonText}>Nueva</Text></Pressable>
        </Link>
      </View>
      {isLoading ? <ActivityIndicator /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!isLoading && compras.length === 0 ? <Text style={styles.empty}>Todavía no tienes compras registradas.</Text> : null}
      <FlatList
        data={compras}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Link href={{ pathname: '/compras/[id]', params: { id: item.id.toString() } }} asChild>
            <Pressable style={styles.card}>
              <Text style={styles.cardTitle}>{item.nombreProducto}</Text>
              <Text>${(item.montoTotalCentavos / 100).toFixed(2)} MXN</Text>
              <Text>{item.mesesAPagar} meses · Compra: {item.fechaCompra}</Text>
              {item.tarjetaNombre ? <Text>Tarjeta: {item.tarjetaNombre}</Text> : null}
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  title: { color: '#0f172a', fontSize: 26, fontWeight: '800' },
  addButton: { backgroundColor: '#1d4ed8', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 },
  addButtonText: { color: '#ffffff', fontWeight: '700' },
  list: { gap: 12, paddingBottom: 24 },
  card: { backgroundColor: '#f8fafc', borderColor: '#cbd5e1', borderRadius: 8, borderWidth: 1, gap: 5, padding: 16 },
  cardTitle: { color: '#0f172a', fontSize: 18, fontWeight: '700' },
  empty: { color: '#475569', paddingVertical: 30, textAlign: 'center' },
  error: { color: '#b91c1c' },
});
