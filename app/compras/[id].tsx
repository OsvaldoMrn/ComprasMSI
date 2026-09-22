import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { CompraForm } from '../../src/components/compras/CompraForm';
import { getCompraById } from '../../src/database/repositories/comprasRepository';
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
  if (!compra) return <Text style={styles.notFound}>Compra no encontrada.</Text>;
  const currentCompra = compra;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Editar compra MSI</Text>
      <CompraForm
        initialValue={currentCompra}
        submitLabel="Guardar cambios"
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
    </View>
  );

  async function archiveAndGo() {
    await archive(currentCompra.id);
    router.replace('/compras');
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { color: '#0f172a', fontSize: 24, fontWeight: '800', paddingHorizontal: 20, paddingTop: 18 },
  loader: { flex: 1 },
  notFound: { color: '#475569', padding: 24 },
  deleteButton: { alignItems: 'center', borderColor: '#dc2626', borderRadius: 8, borderWidth: 1, margin: 20, minHeight: 48, justifyContent: 'center' },
  deleteText: { color: '#b91c1c', fontWeight: '700' },
});
