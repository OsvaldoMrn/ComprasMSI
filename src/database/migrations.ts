import type { SQLiteDatabase } from 'expo-sqlite';

import { INITIAL_SCHEMA } from './schema';

export const DATABASE_VERSION = 1;

export async function runMigrations(database: SQLiteDatabase): Promise<void> {
  const versionRow = await database.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  let currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion < 1) {
    await database.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    await database.execAsync(INITIAL_SCHEMA);
    currentVersion = 1;
  }

  await database.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
