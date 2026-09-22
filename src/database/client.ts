import * as SQLite from 'expo-sqlite';

export const DATABASE_NAME = 'compras-msi.db';

export type DatabaseTimestamp = string;

export function openDatabase(): Promise<SQLite.SQLiteDatabase> {
	return SQLite.openDatabaseAsync(DATABASE_NAME);
}
