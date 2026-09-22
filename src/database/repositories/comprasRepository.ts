import type { SQLiteDatabase } from 'expo-sqlite';

import type { CompraMSI, NuevaCompraMSI } from '../../features/compras/types';

type CompraRow = {
  id: number;
  description: string;
  amount_minor: number;
  transaction_date: string;
  first_due_date: string;
  installment_count: number;
  account_id: number | null;
  account_name: string | null;
  merchant_name: string | null;
  category_id: number | null;
  category_name: string | null;
  archived_at: string | null;
};

function mapCompra(row: CompraRow): CompraMSI {
  return {
    id: row.id,
    nombreProducto: row.description,
    montoTotalCentavos: row.amount_minor,
    mesesAPagar: row.installment_count,
    fechaCompra: row.transaction_date,
    fechaPrimerCargo: row.first_due_date,
    tarjetaId: row.account_id,
    categoriaId: row.category_id,
    tarjetaNombre: row.account_name,
    comercioNombre: row.merchant_name,
    categoriaNombre: row.category_name,
    estado: row.archived_at ? 'archived' : 'active',
  };
}

const PURCHASE_QUERY = `
  SELECT
    t.id,
    t.description,
    t.amount_minor,
    t.transaction_date,
    p.first_due_date,
    p.installment_count,
    a.id AS account_id,
    a.name AS account_name,
    m.name AS merchant_name,
    c.id AS category_id,
    c.name AS category_name,
    t.archived_at
  FROM transactions t
  JOIN installment_plans p ON p.transaction_id = t.id
  LEFT JOIN financial_accounts a ON a.id = t.account_id
  LEFT JOIN merchants m ON m.id = t.merchant_id
  LEFT JOIN categories c ON c.id = t.category_id
`;

export async function listCompras(database: SQLiteDatabase): Promise<CompraMSI[]> {
  const rows = await database.getAllAsync<CompraRow>(
    `${PURCHASE_QUERY} WHERE t.archived_at IS NULL ORDER BY t.transaction_date DESC, t.id DESC`
  );
  return rows.map(mapCompra);
}

export async function getCompraById(
  database: SQLiteDatabase,
  id: number
): Promise<CompraMSI | null> {
  const row = await database.getFirstAsync<CompraRow>(
    `${PURCHASE_QUERY} WHERE t.id = ?`,
    id
  );
  return row ? mapCompra(row) : null;
}

function addMonths(dateValue: string, monthOffset: number): string {
  const date = new Date(`${dateValue}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + monthOffset);
  return date.toISOString().slice(0, 10);
}

function buildInstallmentAmounts(totalMinor: number, count: number): number[] {
  const baseAmount = Math.floor(totalMinor / count);
  const remainder = totalMinor % count;
  return Array.from({ length: count }, (_, index) => baseAmount + (index < remainder ? 1 : 0));
}

export async function createCompra(
  database: SQLiteDatabase,
  input: NuevaCompraMSI
): Promise<number> {
  const now = new Date().toISOString();
  let createdTransactionId = 0;

  await database.withExclusiveTransactionAsync(async (transaction) => {
    let accountId: number | null = null;
    if (input.tarjetaNombre?.trim()) {
      const account = await transaction.getFirstAsync<{ id: number }>(
        'SELECT id FROM financial_accounts WHERE name = ? AND archived_at IS NULL LIMIT 1',
        input.tarjetaNombre.trim()
      );
      if (account) {
        accountId = account.id;
      } else {
        const result = await transaction.runAsync(
          `INSERT INTO financial_accounts (name, created_at, updated_at)
           VALUES (?, ?, ?)`,
          input.tarjetaNombre.trim(),
          now,
          now
        );
        accountId = result.lastInsertRowId;
      }
    }

    let categoryId: number | null = null;
    if (input.categoriaNombre?.trim()) {
      const category = await transaction.getFirstAsync<{ id: number }>(
        'SELECT id FROM categories WHERE name = ? AND archived_at IS NULL LIMIT 1',
        input.categoriaNombre.trim()
      );
      if (category) {
        categoryId = category.id;
      } else {
        const result = await transaction.runAsync(
          `INSERT INTO categories (name, created_at, updated_at)
           VALUES (?, ?, ?)`,
          input.categoriaNombre.trim(),
          now,
          now
        );
        categoryId = result.lastInsertRowId;
      }
    }

    let merchantId: number | null = null;
    if (input.comercioNombre?.trim()) {
      const merchant = await transaction.getFirstAsync<{ id: number }>(
        'SELECT id FROM merchants WHERE name = ? AND archived_at IS NULL LIMIT 1',
        input.comercioNombre.trim()
      );
      if (merchant) {
        merchantId = merchant.id;
      } else {
        const result = await transaction.runAsync(
          `INSERT INTO merchants (name, category_id, created_at, updated_at)
           VALUES (?, ?, ?, ?)`,
          input.comercioNombre.trim(),
          categoryId,
          now,
          now
        );
        merchantId = result.lastInsertRowId;
      }
    }

    const transactionResult = await transaction.runAsync(
      `INSERT INTO transactions (
        account_id, merchant_id, category_id, description, amount_minor,
        transaction_date, posted_date, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      accountId,
      merchantId,
      categoryId,
      input.nombreProducto.trim(),
      input.montoTotalCentavos,
      input.fechaCompra,
      input.fechaCompra,
      now,
      now
    );

    const transactionId = transactionResult.lastInsertRowId;
    createdTransactionId = transactionId;
    await transaction.runAsync(
      `INSERT INTO installment_plans (
        transaction_id, installment_count, first_due_date, total_principal_minor,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      transactionId,
      input.mesesAPagar,
      input.fechaPrimerCargo,
      input.montoTotalCentavos,
      now,
      now
    );

    const plan = await transaction.getFirstAsync<{ id: number }>(
      'SELECT id FROM installment_plans WHERE transaction_id = ?',
      transactionId
    );
    if (!plan) {
      throw new Error('No se pudo crear el plan de mensualidades.');
    }

    const amounts = buildInstallmentAmounts(input.montoTotalCentavos, input.mesesAPagar);
    for (const [index, amount] of amounts.entries()) {
      await transaction.runAsync(
        `INSERT INTO installments (
          installment_plan_id, installment_number, due_date, principal_minor,
          total_minor, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        plan.id,
        index + 1,
        addMonths(input.fechaPrimerCargo, index),
        amount,
        amount,
        now,
        now
      );
    }

  });

  return createdTransactionId;
}

export async function updateCompra(
  database: SQLiteDatabase,
  id: number,
  input: NuevaCompraMSI
): Promise<void> {
  const now = new Date().toISOString();
  await database.withExclusiveTransactionAsync(async (transaction) => {
    let accountId: number | null = null;
    if (input.tarjetaNombre?.trim()) {
      const account = await transaction.getFirstAsync<{ id: number }>(
        'SELECT id FROM financial_accounts WHERE name = ? AND archived_at IS NULL LIMIT 1',
        input.tarjetaNombre.trim()
      );
      if (account) {
        accountId = account.id;
      } else {
        const result = await transaction.runAsync(
          'INSERT INTO financial_accounts (name, created_at, updated_at) VALUES (?, ?, ?)',
          input.tarjetaNombre.trim(), now, now
        );
        accountId = result.lastInsertRowId;
      }
    }

    let categoryId: number | null = null;
    if (input.categoriaNombre?.trim()) {
      const category = await transaction.getFirstAsync<{ id: number }>(
        'SELECT id FROM categories WHERE name = ? AND archived_at IS NULL LIMIT 1',
        input.categoriaNombre.trim()
      );
      if (category) {
        categoryId = category.id;
      } else {
        const result = await transaction.runAsync(
          'INSERT INTO categories (name, created_at, updated_at) VALUES (?, ?, ?)',
          input.categoriaNombre.trim(), now, now
        );
        categoryId = result.lastInsertRowId;
      }
    }

    let merchantId: number | null = null;
    if (input.comercioNombre?.trim()) {
      const merchant = await transaction.getFirstAsync<{ id: number }>(
        'SELECT id FROM merchants WHERE name = ? AND archived_at IS NULL LIMIT 1',
        input.comercioNombre.trim()
      );
      if (merchant) {
        merchantId = merchant.id;
      } else {
        const result = await transaction.runAsync(
          'INSERT INTO merchants (name, category_id, created_at, updated_at) VALUES (?, ?, ?, ?)',
          input.comercioNombre.trim(), categoryId, now, now
        );
        merchantId = result.lastInsertRowId;
      }
    }

    await transaction.runAsync(
      `UPDATE transactions SET account_id = ?, merchant_id = ?, category_id = ?,
       description = ?, amount_minor = ?, transaction_date = ?, posted_date = ?, updated_at = ?
       WHERE id = ? AND archived_at IS NULL`,
      accountId, merchantId, categoryId, input.nombreProducto.trim(),
      input.montoTotalCentavos, input.fechaCompra, input.fechaCompra, now, id
    );

    const plan = await transaction.getFirstAsync<{ id: number }>(
      'SELECT id FROM installment_plans WHERE transaction_id = ?', id
    );
    if (!plan) throw new Error('No se encontró el plan de mensualidades.');

    await transaction.runAsync(
      `UPDATE installment_plans
       SET installment_count = ?, first_due_date = ?, total_principal_minor = ?, updated_at = ?
       WHERE id = ?`,
      input.mesesAPagar, input.fechaPrimerCargo, input.montoTotalCentavos, now, plan.id
    );
    await transaction.runAsync('DELETE FROM installments WHERE installment_plan_id = ?', plan.id);

    const amounts = buildInstallmentAmounts(input.montoTotalCentavos, input.mesesAPagar);
    for (const [index, amount] of amounts.entries()) {
      await transaction.runAsync(
        `INSERT INTO installments (
          installment_plan_id, installment_number, due_date, principal_minor,
          total_minor, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        plan.id, index + 1, addMonths(input.fechaPrimerCargo, index), amount, amount, now, now
      );
    }
  });
}

export async function archiveCompra(database: SQLiteDatabase, id: number): Promise<void> {
  await database.runAsync(
    `UPDATE transactions SET archived_at = ?, updated_at = ? WHERE id = ?`,
    new Date().toISOString(),
    new Date().toISOString(),
    id
  );
}

export type ComprasRepository = {
  list: typeof listCompras;
  getById: typeof getCompraById;
  create: typeof createCompra;
  update: typeof updateCompra;
  archive: typeof archiveCompra;
};
