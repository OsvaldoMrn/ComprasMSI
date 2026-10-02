import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { calculateFinancialSummary, calculateMonthlyAmount, isCompraFinished } from '../../src/features/compras/calculations';
import { useComprasMSI } from '../../src/features/compras/hooks';
import type { CompraMSI } from '../../src/features/compras/types';
import { colors, radius, spacing } from '../../src/constants/theme';
import { formatMoney } from '../../src/lib/money';

type StatusFilter = 'all' | 'active' | 'finished' | 'archived';
type SortOption = 'recent' | 'monthly' | 'debt' | 'completion';

export default function ComprasScreen() {
  const { compras, isLoading, error, restore } = useComprasMSI();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [cardFilter, setCardFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [sortOption, setSortOption] = useState<SortOption>('recent');

  const visibleCompras = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    const normalizedCategory = categoryFilter.trim().toLocaleLowerCase();
    const normalizedCard = cardFilter.trim().toLocaleLowerCase();
    return compras.filter((compra) => {
      const matchesSearch = !normalizedSearch || [compra.nombreProducto, compra.comercioNombre, compra.categoriaNombre, compra.tarjetaNombre].filter(Boolean).some((value) => value!.toLocaleLowerCase().includes(normalizedSearch));
      const matchesCategory = !normalizedCategory || compra.categoriaNombre?.toLocaleLowerCase().includes(normalizedCategory);
      const matchesCard = !normalizedCard || compra.tarjetaNombre?.toLocaleLowerCase().includes(normalizedCard);
      const finished = compra.estado === 'active' && isCompraFinished(compra);
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'archived' && compra.estado === 'archived') || (statusFilter === 'finished' && finished) || (statusFilter === 'active' && compra.estado === 'active' && !finished);
      return matchesSearch && matchesCategory && matchesCard && matchesStatus;
    }).sort((first, second) => compareCompras(first, second, sortOption));
  }, [cardFilter, categoryFilter, compras, search, sortOption, statusFilter]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.header}><View><Text style={styles.kicker}>TU REGISTRO</Text><Text style={styles.title}>Mis compras</Text></View><Link href="/compras/nueva" asChild><Pressable style={styles.addButton}><Text style={styles.addButtonText}>+ Nueva</Text></Pressable></Link></View>
      <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Buscar una compra..." placeholderTextColor={colors.subtle} />
      <View style={styles.filterRow}><TextInput style={styles.filterInput} value={categoryFilter} onChangeText={setCategoryFilter} placeholder="Categoría" placeholderTextColor={colors.subtle} /><TextInput style={styles.filterInput} value={cardFilter} onChangeText={setCardFilter} placeholder="Tarjeta" placeholderTextColor={colors.subtle} /></View>
      <Text style={styles.controlLabel}>MOSTRAR</Text>
      <View style={styles.chipRow}>{(['active', 'finished', 'archived', 'all'] as StatusFilter[]).map((option) => <Pressable key={option} style={[styles.chip, statusFilter === option && styles.chipSelected]} onPress={() => setStatusFilter(option)}><Text style={statusFilter === option ? styles.chipTextSelected : styles.chipText}>{statusLabel(option)}</Text></Pressable>)}</View>
      <Text style={styles.controlLabel}>ORDENAR POR</Text>
      <View style={styles.chipRow}>{(['recent', 'monthly', 'debt', 'completion'] as SortOption[]).map((option) => <Pressable key={option} style={[styles.chip, sortOption === option && styles.chipSelected]} onPress={() => setSortOption(option)}><Text style={sortOption === option ? styles.chipTextSelected : styles.chipText}>{sortLabel(option)}</Text></Pressable>)}</View>
      {isLoading ? <ActivityIndicator /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!isLoading && compras.length === 0 ? <Text style={styles.empty}>Todavía no tienes compras registradas.</Text> : null}
      {!isLoading && compras.length > 0 && visibleCompras.length === 0 ? <Text style={styles.empty}>No hay compras que coincidan con estos filtros.</Text> : null}
      <FlatList data={visibleCompras} keyExtractor={(item) => item.id.toString()} contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]} renderItem={({ item }) => <View style={styles.card}><Link href={{ pathname: '/compras/[id]', params: { id: item.id.toString() } }} asChild><Pressable><Text style={styles.cardTitle}>{item.nombreProducto}</Text><Text style={styles.cardAmount}>{getPrimaryValue(item, sortOption)}</Text><Text style={styles.cardMeta}>{item.mesesAPagar} meses  ·  {item.fechaCompra}</Text><View style={styles.tagRow}>{item.tarjetaNombre ? <Text style={styles.tag}>{item.tarjetaNombre}</Text> : null}{item.categoriaNombre ? <Text style={styles.tag}>{item.categoriaNombre}</Text> : null}<Text style={[styles.tag, item.estado === 'archived' ? styles.tagArchived : isCompraFinished(item) ? styles.tagFinished : styles.tagActive]}>{item.estado === 'archived' ? 'Archivada' : isCompraFinished(item) ? 'Terminada' : 'Activa'}</Text></View></Pressable></Link>{item.estado === 'archived' ? <Pressable style={styles.restoreButton} onPress={() => void restore(item.id)}><Text style={styles.restoreText}>Restaurar</Text></Pressable> : null}</View>} />
    </View>
  );
}

function statusLabel(status: StatusFilter): string { return { all: 'Todas', active: 'Activas', finished: 'Terminadas', archived: 'Archivadas' }[status]; }
function sortLabel(sort: SortOption): string { return { recent: 'Recientes', monthly: 'Mensualidad', debt: 'Deuda', completion: 'Término' }[sort]; }
function compareCompras(first: CompraMSI, second: CompraMSI, sort: SortOption): number { if (sort === 'monthly') return calculateMonthlyAmount(second) - calculateMonthlyAmount(first); if (sort === 'debt') return calculateFinancialSummary(second).remainingDebtMinor - calculateFinancialSummary(first).remainingDebtMinor; if (sort === 'completion') return calculateFinancialSummary(first).completionDate.localeCompare(calculateFinancialSummary(second).completionDate); return second.fechaCompra.localeCompare(first.fechaCompra) || second.id - first.id; }
function getPrimaryValue(compra: CompraMSI, sort: SortOption): string {
  if (sort === 'monthly') return `${formatMoney(calculateMonthlyAmount(compra))}`;
  if (sort === 'debt') return `${formatMoney(calculateFinancialSummary(compra).remainingDebtMinor)}`;
  if (sort === 'completion') return `${formatMonth(calculateFinancialSummary(compra).completionDate.slice(0, 7))}`;
  return `${formatMoney(compra.montoTotalCentavos)}`;
}
function formatMonth(month: string): string {
  const [year, monthNumber] = month.split('-');
  const names = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${names[Number(monthNumber) - 1]} ${year}`;
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.canvas, flex: 1, padding: spacing.lg },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  kicker: { color: colors.muted, fontSize: 11, fontWeight: '800' },
  title: { color: colors.ink, fontSize: 30, fontWeight: '900', marginTop: 2 },
  addButton: { backgroundColor: colors.accent, borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 11 },
  addButtonText: { color: colors.ink, fontWeight: '900' },
  searchInput: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, color: colors.ink, fontSize: 15, minHeight: 48, paddingHorizontal: 14 },
  filterRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  filterInput: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, color: colors.ink, flex: 1, minHeight: 44, paddingHorizontal: 12 },
  controlLabel: { color: colors.muted, fontSize: 11, fontWeight: '800', marginTop: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  chipTextSelected: { color: colors.surface, fontSize: 13, fontWeight: '800' },
  list: { gap: spacing.md, paddingBottom: 24, paddingTop: spacing.md },
  card: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, gap: 6, padding: spacing.md },
  cardTitle: { color: colors.ink, fontSize: 19, fontWeight: '900' },
  cardAmount: { color: colors.primary, fontSize: 17, fontWeight: '900' },
  cardMeta: { color: colors.muted, fontSize: 13 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 3 },
  tag: { backgroundColor: colors.canvas, borderRadius: radius.pill, color: colors.muted, fontSize: 12, fontWeight: '700', overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 5 },
  tagActive: { backgroundColor: colors.successSoft, color: colors.success },
  tagFinished: { backgroundColor: colors.primarySoft, color: colors.primary },
  tagArchived: { backgroundColor: colors.dangerSoft, color: colors.danger },
  restoreButton: { alignItems: 'center', borderColor: colors.primary, borderRadius: radius.sm, borderWidth: 1, marginTop: 10, minHeight: 40, justifyContent: 'center' },
  restoreText: { color: colors.primary, fontWeight: '800' },
  empty: { color: colors.muted, paddingVertical: 30, textAlign: 'center' },
  error: { color: colors.danger },
});
