import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { calculateFinancialSummary, calculateMonthlyAmount, isCompraFinished } from '../../src/features/compras/calculations';
import { useComprasMSI } from '../../src/features/compras/hooks';
import type { CompraMSI } from '../../src/features/compras/types';

type StatusFilter = 'all' | 'active' | 'finished' | 'archived';
type SortOption = 'recent' | 'monthly' | 'debt' | 'completion';

export default function ComprasScreen() {
  const { compras, isLoading, error, restore } = useComprasMSI();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [cardFilter, setCardFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [sortOption, setSortOption] = useState<SortOption>('recent');

  const visibleCompras = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    const normalizedCategory = categoryFilter.trim().toLocaleLowerCase();
    const normalizedCard = cardFilter.trim().toLocaleLowerCase();
    return compras
      .filter((compra) => {
        const matchesSearch = !normalizedSearch || [compra.nombreProducto, compra.comercioNombre, compra.categoriaNombre, compra.tarjetaNombre]
          .filter(Boolean)
          .some((value) => value!.toLocaleLowerCase().includes(normalizedSearch));
        const matchesCategory = !normalizedCategory || compra.categoriaNombre?.toLocaleLowerCase().includes(normalizedCategory);
        const matchesCard = !normalizedCard || compra.tarjetaNombre?.toLocaleLowerCase().includes(normalizedCard);
        const finished = compra.estado === 'active' && isCompraFinished(compra);
        const matchesStatus = statusFilter === 'all'
          || (statusFilter === 'archived' && compra.estado === 'archived')
          || (statusFilter === 'finished' && finished)
          || (statusFilter === 'active' && compra.estado === 'active' && !finished);
        return matchesSearch && matchesCategory && matchesCard && matchesStatus;
      })
      .sort((first, second) => compareCompras(first, second, sortOption));
  }, [cardFilter, categoryFilter, compras, search, sortOption, statusFilter]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Compras MSI</Text>
        <Link href="/compras/nueva" asChild>
          <Pressable style={styles.addButton}><Text style={styles.addButtonText}>Nueva</Text></Pressable>
        </Link>
      </View>
      <TextInput
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar producto, comercio, categoría o tarjeta"
      />
      <View style={styles.filterRow}>
        <TextInput style={styles.filterInput} value={categoryFilter} onChangeText={setCategoryFilter} placeholder="Categoría" />
        <TextInput style={styles.filterInput} value={cardFilter} onChangeText={setCardFilter} placeholder="Tarjeta" />
      </View>
      <Text style={styles.controlLabel}>Estado</Text>
      <View style={styles.chipRow}>
        {(['active', 'finished', 'archived', 'all'] as StatusFilter[]).map((option) => (
          <Pressable key={option} style={[styles.chip, statusFilter === option && styles.chipSelected]} onPress={() => setStatusFilter(option)}>
            <Text style={statusFilter === option ? styles.chipTextSelected : styles.chipText}>{statusLabel(option)}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.controlLabel}>Ordenar</Text>
      <View style={styles.chipRow}>
        {(['recent', 'monthly', 'debt', 'completion'] as SortOption[]).map((option) => (
          <Pressable key={option} style={[styles.chip, sortOption === option && styles.chipSelected]} onPress={() => setSortOption(option)}>
            <Text style={sortOption === option ? styles.chipTextSelected : styles.chipText}>{sortLabel(option)}</Text>
          </Pressable>
        ))}
      </View>
      {isLoading ? <ActivityIndicator /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!isLoading && compras.length === 0 ? <Text style={styles.empty}>Todavía no tienes compras registradas.</Text> : null}
      {!isLoading && compras.length > 0 && visibleCompras.length === 0 ? <Text style={styles.empty}>No hay compras que coincidan con estos filtros.</Text> : null}
      <FlatList
        data={visibleCompras}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Link href={{ pathname: '/compras/[id]', params: { id: item.id.toString() } }} asChild>
              <Pressable>
              <Text style={styles.cardTitle}>{item.nombreProducto}</Text>
              <Text>${(item.montoTotalCentavos / 100).toFixed(2)} MXN</Text>
              <Text>{item.mesesAPagar} meses · Compra: {item.fechaCompra}</Text>
              {item.tarjetaNombre ? <Text>Tarjeta: {item.tarjetaNombre}</Text> : null}
              {item.categoriaNombre ? <Text>Categoría: {item.categoriaNombre}</Text> : null}
              <Text style={styles.cardStatus}>{item.estado === 'archived' ? 'Archivada' : isCompraFinished(item) ? 'Terminada' : 'Activa'}</Text>
              </Pressable>
            </Link>
            {item.estado === 'archived' ? <Pressable style={styles.restoreButton} onPress={() => void restore(item.id)}><Text style={styles.restoreText}>Restaurar</Text></Pressable> : null}
          </View>
        )}
      />
    </View>
  );
}

function statusLabel(status: StatusFilter): string {
  return { all: 'Todas', active: 'Activas', finished: 'Terminadas', archived: 'Archivadas' }[status];
}

function sortLabel(sort: SortOption): string {
  return { recent: 'Recientes', monthly: 'Mensualidad', debt: 'Deuda', completion: 'Término' }[sort];
}

function compareCompras(first: CompraMSI, second: CompraMSI, sort: SortOption): number {
  if (sort === 'monthly') return calculateMonthlyAmount(second) - calculateMonthlyAmount(first);
  if (sort === 'debt') return calculateFinancialSummary(second).remainingDebtMinor - calculateFinancialSummary(first).remainingDebtMinor;
  if (sort === 'completion') return calculateFinancialSummary(first).completionDate.localeCompare(calculateFinancialSummary(second).completionDate);
  return second.fechaCompra.localeCompare(first.fechaCompra) || second.id - first.id;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  title: { color: '#0f172a', fontSize: 26, fontWeight: '800' },
  addButton: { backgroundColor: '#1d4ed8', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 },
  addButtonText: { color: '#ffffff', fontWeight: '700' },
  searchInput: { borderColor: '#cbd5e1', borderRadius: 8, borderWidth: 1, fontSize: 15, minHeight: 46, paddingHorizontal: 12 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterInput: { borderColor: '#cbd5e1', borderRadius: 8, borderWidth: 1, flex: 1, minHeight: 42, paddingHorizontal: 10 },
  controlLabel: { color: '#475569', fontSize: 13, fontWeight: '700', marginTop: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderColor: '#cbd5e1', borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  chipSelected: { backgroundColor: '#1d4ed8', borderColor: '#1d4ed8' },
  chipText: { color: '#334155', fontSize: 13 },
  chipTextSelected: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  list: { gap: 12, paddingBottom: 24 },
  card: { backgroundColor: '#f8fafc', borderColor: '#cbd5e1', borderRadius: 8, borderWidth: 1, gap: 5, padding: 16 },
  cardTitle: { color: '#0f172a', fontSize: 18, fontWeight: '700' },
  cardStatus: { color: '#475569', fontSize: 13, fontWeight: '700', marginTop: 4 },
  restoreButton: { alignItems: 'center', borderColor: '#1d4ed8', borderRadius: 8, borderWidth: 1, marginTop: 10, minHeight: 38, justifyContent: 'center' },
  restoreText: { color: '#1d4ed8', fontWeight: '700' },
  empty: { color: '#475569', paddingVertical: 30, textAlign: 'center' },
  error: { color: '#b91c1c' },
});
