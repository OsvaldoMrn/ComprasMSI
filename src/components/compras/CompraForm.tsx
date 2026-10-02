import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatMinorAsInput, parseMoneyToMinor, validateCompra } from '../../lib/validation';
import type { CompraMSI, NuevaCompraMSI } from '../../features/compras/types';
import { colors, radius, spacing } from '../../constants/theme';
import { formatDateForInput, formatDateInput, getLocalDateISO, parseDateInputToISO } from '../../lib/dates';

type CompraFormProps = {
  initialValue?: CompraMSI;
  submitLabel: string;
  onSubmit: (value: NuevaCompraMSI) => Promise<void>;
  scrollable?: boolean;
  onFieldFocus?: (input: TextInput) => void;
};

const today = getLocalDateISO();

export function CompraForm({ initialValue, submitLabel, onSubmit, scrollable = true, onFieldFocus }: CompraFormProps) {
  const [nombreProducto, setNombreProducto] = useState(initialValue?.nombreProducto ?? '');
  const [monto, setMonto] = useState(
    initialValue ? formatMinorAsInput(initialValue.montoTotalCentavos) : ''
  );
  const [meses, setMeses] = useState(initialValue?.mesesAPagar.toString() ?? '');
  const [fechaCompra, setFechaCompra] = useState(formatDateForInput(initialValue?.fechaCompra ?? today));
  const [fechaPrimerCargo, setFechaPrimerCargo] = useState(formatDateForInput(initialValue?.fechaPrimerCargo ?? today));
  const [tarjetaNombre, setTarjetaNombre] = useState(initialValue?.tarjetaNombre ?? '');
  const [comercioNombre, setComercioNombre] = useState(initialValue?.comercioNombre ?? '');
  const [categoriaNombre, setCategoriaNombre] = useState(initialValue?.categoriaNombre ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const scrollOffset = useRef(0);

  function revealField(input: TextInput) {
    if (!scrollable) return;
    requestAnimationFrame(() => {
      setTimeout(() => {
        input.measureInWindow((_x, y) => {
          const targetOffset = Math.max(0, scrollOffset.current + y - 96);
          scrollRef.current?.scrollTo({ y: targetOffset, animated: true });
        });
      }, 220);
    });
  }

  async function handleSubmit() {
    const value: NuevaCompraMSI = {
      nombreProducto,
      montoTotalCentavos: parseMoneyToMinor(monto),
      mesesAPagar: Number.parseInt(meses, 10),
      fechaCompra: parseDateInputToISO(fechaCompra),
      fechaPrimerCargo: parseDateInputToISO(fechaPrimerCargo),
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

  const formContent = (
    <>
      <Field label="Producto" placeholder="Ej. PS5" value={nombreProducto} onChangeText={setNombreProducto} onFocus={onFieldFocus ?? revealField} error={errors.nombreProducto} />
      <Field label="Monto total" helper="En pesos mexicanos" placeholder="Ej. 12000.00" value={monto} onChangeText={setMonto} keyboardType="decimal-pad" onFocus={onFieldFocus ?? revealField} error={errors.montoTotalCentavos} />
      <Field label="Número de meses" placeholder="Ej. 12" value={meses} onChangeText={setMeses} keyboardType="number-pad" onFocus={onFieldFocus ?? revealField} error={errors.mesesAPagar} />
      <Field label="Fecha de compra" helper="Día mes año" placeholder="13 10 2026" value={fechaCompra} onChangeText={(value) => setFechaCompra(formatDateInput(value))} onFocus={onFieldFocus ?? revealField} error={errors.fechaCompra} />
      <Field label="Fecha del primer cargo" helper="Día mes año" placeholder="13 11 2026" value={fechaPrimerCargo} onChangeText={(value) => setFechaPrimerCargo(formatDateInput(value))} onFocus={onFieldFocus ?? revealField} error={errors.fechaPrimerCargo} />
      <Field label="Tarjeta" optional placeholder="Ej. BBVA" value={tarjetaNombre} onChangeText={setTarjetaNombre} onFocus={onFieldFocus ?? revealField} />
      <Field label="Comercio" optional placeholder="Ej. Liverpool" value={comercioNombre} onChangeText={setComercioNombre} onFocus={onFieldFocus ?? revealField} />
      <Field label="Categoría" optional placeholder="Ej. Tecnología" value={categoriaNombre} onChangeText={setCategoriaNombre} onFocus={onFieldFocus ?? revealField} />
      {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
      <Pressable style={[styles.button, isSaving && styles.disabled]} disabled={isSaving} onPress={() => void handleSubmit()}>
        <Text style={styles.buttonText}>{isSaving ? 'Guardando...' : submitLabel}</Text>
      </Pressable>
    </>
  );

  if (scrollable) {
    return (
      <KeyboardAvoidingView style={styles.keyboardContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" onScroll={(event) => { scrollOffset.current = event.nativeEvent.contentOffset.y; }} scrollEventThrottle={16}>
          {formContent}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return <View style={[styles.content, styles.inlineContent]}>{formContent}</View>;
}

type FieldProps = {
  label: string;
  helper?: string;
  placeholder?: string;
  optional?: boolean;
  onFocus?: (input: TextInput) => void;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
  error?: string;
};

function Field({ label, helper, placeholder, optional, value, onChangeText, keyboardType = 'default', onFocus, error }: FieldProps) {
  const inputRef = useRef<TextInput>(null);

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {optional ? <Text style={styles.optional}>Opcional</Text> : null}
      </View>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        value={value}
        ref={inputRef}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder ?? label}
        placeholderTextColor={colors.subtle}
        onFocus={() => { if (inputRef.current) onFocus?.(inputRef.current); }}
        autoCapitalize="sentences"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1 },
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: 320 },
  inlineContent: { paddingBottom: 0 },
  field: { gap: spacing.xs },
  labelRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  optional: { color: colors.subtle, fontSize: 12, fontWeight: '700' },
  helper: { color: colors.muted, fontSize: 12 },
  input: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, color: colors.ink, minHeight: 50, paddingHorizontal: 14, fontSize: 16 },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 13 },
  button: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.md, minHeight: 54, justifyContent: 'center', marginTop: spacing.sm },
  disabled: { opacity: 0.6 },
  buttonText: { color: colors.surface, fontSize: 16, fontWeight: '900' },
});
