import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';

import { DATABASE_NAME } from '../src/database/client';
import { runMigrations } from '../src/database/migrations';
import { AppProvider } from '../src/context/AppProvider';

export const unstable_settings = {
  anchor: 'index',
};

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={runMigrations}>
      <AppProvider>
        <Stack>
          <Stack.Screen name="compras/[id]" options={{ title: 'Detalle de compra' }} />
        </Stack>
      </AppProvider>
    </SQLiteProvider>
  );
}
