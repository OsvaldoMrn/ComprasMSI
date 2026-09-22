import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useComprasMSI } from '../src/features/compras/hooks';

export default function HomeScreen() {
  const { compras, isLoading } = useComprasMSI();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Compras MSI</Text>
      <Text style={styles.subtitle}>Control local de tus compras a meses sin intereses.</Text>
      <Text style={styles.count}>{isLoading ? 'Cargando...' : `${compras.length} compra(s) registrada(s)`}</Text>
      <Link href="/compras/nueva" style={styles.button}>Agregar compra MSI</Link>
      <Link href="/compras" style={styles.link}>Ver compras</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 18, padding: 24 },
  title: { color: '#0f172a', fontSize: 30, fontWeight: '800', marginTop: 30 },
  subtitle: { color: '#475569', fontSize: 16 },
  count: { color: '#1e293b', fontSize: 18, fontWeight: '600', marginTop: 20 },
  button: { backgroundColor: '#1d4ed8', borderRadius: 8, color: '#ffffff', fontSize: 16, fontWeight: '700', padding: 15, textAlign: 'center' },
  link: { color: '#1d4ed8', fontSize: 16, textAlign: 'center' },
});
