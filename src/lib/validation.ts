import type { NuevaCompraMSI } from '../features/compras/types';

export type CompraValidationErrors = Partial<Record<keyof NuevaCompraMSI, string>>;

export function validateCompra(input: NuevaCompraMSI): CompraValidationErrors {
	const errors: CompraValidationErrors = {};
	if (!input.nombreProducto.trim()) errors.nombreProducto = 'Escribe el nombre del producto.';
	if (!Number.isInteger(input.montoTotalCentavos) || input.montoTotalCentavos <= 0) {
		errors.montoTotalCentavos = 'El monto debe ser mayor que cero.';
	}
	if (!Number.isInteger(input.mesesAPagar) || input.mesesAPagar <= 0) {
		errors.mesesAPagar = 'Indica un número de meses válido.';
	}
	if (!/^\d{4}-\d{2}-\d{2}$/.test(input.fechaCompra)) {
		errors.fechaCompra = 'Usa el formato AAAA-MM-DD.';
	}
	if (!/^\d{4}-\d{2}-\d{2}$/.test(input.fechaPrimerCargo)) {
		errors.fechaPrimerCargo = 'Usa el formato AAAA-MM-DD.';
	}
	return errors;
}

export function parseMoneyToMinor(value: string): number {
	const normalized = value.replace(',', '.').trim();
	if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return 0;
	return Math.round(Number(normalized) * 100);
}

export function formatMinorAsInput(value: number): string {
	return (value / 100).toFixed(2);
}
