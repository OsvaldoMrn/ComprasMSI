import { describe, expect, it } from 'vitest';

import { calculateActiveMonthlyCommitment, calculateActiveRemainingDebt, calculateFinancialSummary, calculateInstallments, calculateMonthlyProjection, calculateUpcomingCharges } from '../../src/features/compras/calculations';
import type { CompraMSI } from '../../src/features/compras/types';

const purchase: CompraMSI = {
  id: 1,
  nombreProducto: 'PS5',
  montoTotalCentavos: 10000,
  mesesAPagar: 3,
  fechaCompra: '2026-01-10',
  fechaPrimerCargo: '2026-02-28',
  tarjetaId: null,
  categoriaId: null,
  tarjetaNombre: null,
  comercioNombre: null,
  categoriaNombre: null,
  estado: 'active',
};

describe('Compra MSI calculations', () => {
  it('distributes remaining cents without losing money', () => {
    const installments = calculateInstallments({ ...purchase, montoTotalCentavos: 10001 }, '2026-01-01');
    expect(installments.map((item) => item.amountMinor)).toEqual([3334, 3334, 3333]);
    expect(installments.reduce((total, item) => total + item.amountMinor, 0)).toBe(10001);
  });

  it('calculates progress and remaining debt before the first charge', () => {
    const summary = calculateFinancialSummary(purchase, '2026-02-01');
    expect(summary.elapsedInstallments).toBe(0);
    expect(summary.remainingInstallments).toBe(3);
    expect(summary.remainingDebtMinor).toBe(10000);
  });

  it('marks the current charge on its due date', () => {
    const summary = calculateFinancialSummary(purchase, '2026-02-28');
    expect(summary.elapsedInstallments).toBe(0);
    expect(summary.installments[0].status).toBe('current');
  });

  it('clamps dates correctly when adding months from the end of a month', () => {
    const installments = calculateInstallments(purchase, '2026-01-01');
    expect(installments.map((item) => item.dueDate)).toEqual([
      '2026-02-28',
      '2026-03-28',
      '2026-04-28',
    ]);
  });

  it('reports no remaining debt after the final charge has elapsed', () => {
    const summary = calculateFinancialSummary(purchase, '2026-05-01');
    expect(summary.elapsedInstallments).toBe(3);
    expect(summary.remainingInstallments).toBe(0);
    expect(summary.remainingDebtMinor).toBe(0);
    expect(summary.completionDate).toBe('2026-04-28');
  });

  it('calculates the current monthly commitment across active purchases', () => {
    const secondPurchase = { ...purchase, id: 2, montoTotalCentavos: 6000, mesesAPagar: 6 };
    expect(calculateActiveMonthlyCommitment([purchase, secondPurchase])).toBe(3333 + 1000);
  });

  it('excludes archived purchases from aggregate debt metrics', () => {
    const archivedPurchase = { ...purchase, estado: 'archived' as const };
    expect(calculateActiveRemainingDebt([purchase, archivedPurchase], '2026-02-01')).toBe(10000);
  });

  it('lists upcoming charges within the requested horizon', () => {
    const charges = calculateUpcomingCharges([purchase], '2026-02-01', 60);
    expect(charges.map((charge) => charge.dueDate)).toEqual(['2026-02-28', '2026-03-28']);
    expect(charges[0].nombreProducto).toBe('PS5');
  });

  it('projects charges by calendar month', () => {
    const projection = calculateMonthlyProjection([purchase], '2026-02-01', 4);
    expect(projection.map((month) => month.totalMinor)).toEqual([3334, 3333, 3333, 0]);
    expect(projection.map((month) => month.chargeCount)).toEqual([1, 1, 1, 0]);
  });
});
