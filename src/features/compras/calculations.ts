import type { CompraMSI } from './types';

export type InstallmentStatus = 'upcoming' | 'current' | 'elapsed';

export type Installment = {
  number: number;
  dueDate: string;
  amountMinor: number;
  status: InstallmentStatus;
};

export type CompraFinancialSummary = {
  monthlyAmountMinor: number;
  elapsedInstallments: number;
  remainingInstallments: number;
  remainingDebtMinor: number;
  completionDate: string;
  installments: Installment[];
};

export type UpcomingCharge = Installment & {
  compraId: number;
  nombreProducto: string;
};

export type MonthlyProjection = {
  month: string;
  totalMinor: number;
  chargeCount: number;
};

function parseDate(dateValue: string): Date {
  const date = new Date(`${dateValue}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Fecha inválida: ${dateValue}`);
  }
  return date;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(dateValue: string, dayOffset: number): string {
  const date = parseDate(dateValue);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return formatDate(date);
}

function addMonths(dateValue: string, monthOffset: number): string {
  const source = parseDate(dateValue);
  const targetMonth = source.getUTCMonth() + monthOffset;
  const targetYear = source.getUTCFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
  const day = Math.min(source.getUTCDate(), lastDay);
  return formatDate(new Date(Date.UTC(targetYear, normalizedMonth, day)));
}

function buildAmounts(totalMinor: number, count: number): number[] {
  if (!Number.isInteger(totalMinor) || totalMinor <= 0) {
    throw new Error('El monto total debe ser un entero positivo en centavos.');
  }
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error('El número de mensualidades debe ser un entero positivo.');
  }
  const base = Math.floor(totalMinor / count);
  const remainder = totalMinor % count;
  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
}

export function calculateMonthlyAmount(compra: CompraMSI): number {
  return Math.floor(compra.montoTotalCentavos / compra.mesesAPagar);
}

export function calculateInstallments(
  compra: CompraMSI,
  asOfDate = formatDate(new Date())
): Installment[] {
  parseDate(asOfDate);
  const amounts = buildAmounts(compra.montoTotalCentavos, compra.mesesAPagar);
  return amounts.map((amountMinor, index) => {
    const dueDate = addMonths(compra.fechaPrimerCargo, index);
    const status: InstallmentStatus = dueDate < asOfDate
      ? 'elapsed'
      : dueDate === asOfDate
        ? 'current'
        : 'upcoming';
    return { number: index + 1, dueDate, amountMinor, status };
  });
}

export function calculateFinancialSummary(
  compra: CompraMSI,
  asOfDate = formatDate(new Date())
): CompraFinancialSummary {
  const installments = calculateInstallments(compra, asOfDate);
  const elapsedInstallments = installments.filter((item) => item.status === 'elapsed').length;
  const remaining = installments.slice(elapsedInstallments);

  return {
    monthlyAmountMinor: calculateMonthlyAmount(compra),
    elapsedInstallments,
    remainingInstallments: remaining.length,
    remainingDebtMinor: remaining.reduce((total, item) => total + item.amountMinor, 0),
    completionDate: installments[installments.length - 1].dueDate,
    installments,
  };
}

export function calculateActiveMonthlyCommitment(compras: CompraMSI[]): number {
  return compras
    .filter((compra) => compra.estado === 'active')
    .reduce((total, compra) => total + calculateMonthlyAmount(compra), 0);
}

export function calculateActiveRemainingDebt(
  compras: CompraMSI[],
  asOfDate = formatDate(new Date())
): number {
  return compras
    .filter((compra) => compra.estado === 'active')
    .reduce((total, compra) => total + calculateFinancialSummary(compra, asOfDate).remainingDebtMinor, 0);
}

export function calculateUpcomingCharges(
  compras: CompraMSI[],
  asOfDate = formatDate(new Date()),
  daysAhead = 30
): UpcomingCharge[] {
  const endDate = addDays(asOfDate, daysAhead);
  return compras
    .filter((compra) => compra.estado === 'active')
    .flatMap((compra) => calculateInstallments(compra, asOfDate)
      .filter((installment) => installment.dueDate >= asOfDate && installment.dueDate <= endDate)
      .map((installment) => ({ ...installment, compraId: compra.id, nombreProducto: compra.nombreProducto })))
    .sort((first, second) => first.dueDate.localeCompare(second.dueDate) || first.compraId - second.compraId);
}

export function calculateMonthlyProjection(
  compras: CompraMSI[],
  startDate = formatDate(new Date()),
  monthCount = 6
): MonthlyProjection[] {
  const startMonth = startDate.slice(0, 7);
  return Array.from({ length: monthCount }, (_, index) => {
    const month = addMonths(`${startMonth}-01`, index).slice(0, 7);
    const charges = compras
      .filter((compra) => compra.estado === 'active')
      .flatMap((compra) => calculateInstallments(compra, startDate))
      .filter((installment) => installment.dueDate.startsWith(month));

    return {
      month,
      totalMinor: charges.reduce((total, charge) => total + charge.amountMinor, 0),
      chargeCount: charges.length,
    };
  });
}
