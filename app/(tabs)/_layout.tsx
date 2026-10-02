import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../../src/constants/theme';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtle,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '800' },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line, height: 64 + insets.bottom, paddingBottom: 8 + insets.bottom, paddingTop: 8 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home-variant-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="cargos" options={{ title: 'Cargos', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="chart-bar" color={color} size={size} /> }} />
      <Tabs.Screen name="compras" options={{ title: 'Compras', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="clipboard-check-outline" color={color} size={size} /> }} />
    </Tabs>
  );
}
