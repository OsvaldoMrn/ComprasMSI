import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DATABASE_NAME } from '../src/database/client';
import { runMigrations } from '../src/database/migrations';
import { AppProvider } from '../src/context/AppProvider';
import { colors } from '../src/constants/theme';

export const unstable_settings = {
  anchor: 'index',
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={runMigrations}>
        <AppProvider>
          <StatusBar style="light" />
          <Stack screenOptions={screenOptions}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="compras/nueva" options={{ title: 'Nueva compra' }} />
            <Stack.Screen name="compras/[id]" options={{ title: 'Detalle de compra' }} />
          </Stack>
        </AppProvider>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}

export const screenOptions = {
  headerStyle: { backgroundColor: colors.canvas },
  headerTintColor: colors.ink,
  headerTitleStyle: { color: colors.ink, fontSize: 18, fontWeight: '800' as const },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.canvas },
};
