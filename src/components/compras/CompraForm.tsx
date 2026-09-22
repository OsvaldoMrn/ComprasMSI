import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatMinorAsInput, parseMoneyToMinor, validateCompra } from '../../lib/validation';
import type { CompraMSI, NuevaCompraMSI } from '../../features/compras/types';

type CompraFormProps = {
  initialValue?: CompraMSI;
  submitLabel: string;
  onSubmit: (value: NuevaCompraMSI) => Promise<void>;
};

const today = new Date().toISOString().slice(0, 10);

export function CompraForm({ initialValue, submitLabel, onSubmit }: CompraFormProps) {
  const [nombreProducto, setNombreProducto] = useState(initialValue?.nombreProducto ?? '');
  const [monto, setMonto] = useState(
    initialValue ? formatMinorAsInput(initialValue.montoTotalCentavos) : ''
  );
  const [meses, setMeses] = useState(initialValue?.mesesAPagar.toString() ?? '');
  const [fechaCompra, setFechaCompra] = useState(initialValue?.fechaCompra ?? today);
  const [fechaPrimerCargo, setFechaPrimerCargo] = useState(initialValue?.fechaPrimerCargo ?? today);
  const [tarjetaNombre, setTarjetaNombre] = useState(initialValue?.tarjetaNombre ?? '');
  const [comercioNombre, setComercioNombre] = useState(initialValue?.comercioNombre ?? '');
  const [categoriaNombre, setCategoriaNombre] = useState(initialValue?.categoriaNombre ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSubmit() {
    const value: NuevaCompraMSI = {
      nombreProducto,
      montoTotalCentavos: parseMoneyToMinor(monto),
      mesesAPagar: Number.parseInt(meses, 10),
      fechaCompra,
      fechaPrimerCargo,
      tarjetaNombre: tarjetaNombre.trim() || undefined,
      comercioNombre: comercioNombre.trim() || undefined,
      categoriaNombre: categoriaNombre.trim() || undefined,
    };
    const validationErrors = validateCompra(value);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      await onSubmit(value);
    } catch {
      setSaveError('No se pudo guardar la compra. Intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Field label="Producto" value={nombreProducto} onChangeText={setNombreProducto} error={errors.nombreProducto} />
      <Field label="Monto total (MXN)" value={monto} onChangeText={setMonto} keyboardType="decimal-pad" error={errors.montoTotalCentavos} />
      <Field label="Número de meses" value={meses} onChangeText={setMeses} keyboardType="number-pad" error={errors.mesesAPagar} />
      <Field label="Fecha de compra (AAAA-MM-DD)" value={fechaCompra} onChangeText={setFechaCompra} error={errors.fechaCompra} />
      <Field label="Fecha del primer cargo (AAAA-MM-DD)" value={fechaPrimerCargo} onChangeText={setFechaPrimerCargo} error={errors.fechaPrimerCargo} />
      <Field label="Tarjeta (opcional)" value={tarjetaNombre} onChangeText={setTarjetaNombre} />
      <Field label="Comercio (opcional)" value={comercioNombre} onChangeText={setComercioNombre} />
      <Field label="Categoría (opcional)" value={categoriaNombre} onChangeText={setCategoriaNombre} />
      {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
      <Pressable style={[styles.button, isSaving && styles.disabled]} disabled={isSaving} onPress={() => void handleSubmit()}>
        <Text style={styles.buttonText}>{isSaving ? 'Guardando...' : submitLabel}</Text>
      </Pressable>
    </ScrollView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
  error?: string;
};

function Field({ label, value, onChangeText, keyboardType = 'default', error }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={label}
        autoCapitalize="sentences"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 14 },
  field: { gap: 6 },
  label: { color: '#1f2937', fontSize: 14, fontWeight: '600' },
  input: { borderColor: '#cbd5e1', borderRadius: 8, borderWidth: 1, minHeight: 48, paddingHorizontal: 12, fontSize: 16 },
  inputError: { borderColor: '#dc2626' },
  error: { color: '#b91c1c', fontSize: 13 },
  button: { alignItems: 'center', backgroundColor: '#1d4ed8', borderRadius: 8, minHeight: 50, justifyContent: 'center', marginTop: 8 },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
